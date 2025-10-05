import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
interface SurveyQuestion {
  id: number;
  text: string;
  type: 'single-choice' | 'multiple-choice' | 'likert-5' | 'text' | 'binary';
  options?: string[];
}

interface Survey {
  title: string;
  questions: SurveyQuestion[];
}

type SurveyResponse = Record<string, string | string[]>;


// --- STYLES ---
const GlobalStyles = () => {
    const css = `
        :root {
            --primary-color: #0d47a1;
            --primary-light: #5472d3;
            --primary-dark: #002171;
            --secondary-color: #f5f5f5;
            --text-color: #333;
            --background-color: #eef2f5;
            --border-color: #ddd;
            --success-color: #4CAF50;
            --error-color: #f44336;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        html {
            font-size: 16px;
        }
        body {
            font-family: 'Tajawal', sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            line-height: 1.6;
            direction: rtl;
        }
        #root {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem 1rem;
            min-height: 100vh;
        }
        .container {
            width: 100%;
            max-width: 900px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        header {
            background-color: var(--primary-color);
            color: white;
            padding: 1.5rem;
            text-align: center;
        }
        header h1 {
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
        }
        nav {
            display: flex;
            border-bottom: 1px solid var(--border-color);
        }
        .tab-button {
            flex: 1;
            padding: 1rem;
            font-size: 1.1rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            background-color: #fff;
            color: var(--primary-dark);
            transition: background-color 0.3s, color 0.3s;
            border-bottom: 3px solid transparent;
        }
        .tab-button:hover {
            background-color: var(--secondary-color);
        }
        .tab-button.active {
            color: var(--primary-color);
            font-weight: 700;
            border-bottom-color: var(--primary-color);
        }
        main {
            padding: 2rem;
        }
        .section-content {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .uploader-container {
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            background-color: var(--secondary-color);
            margin-bottom: 1.5rem;
        }
        .uploader-container p {
            margin-bottom: 1rem;
            color: #666;
        }
        .file-input {
            display: none;
        }
        .file-label {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: var(--primary-color);
            color: white;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .file-label:hover {
            background-color: var(--primary-dark);
        }
        .file-name {
            margin-top: 1rem;
            font-weight: 500;
        }
        .btn {
            padding: 0.75rem 2rem;
            font-size: 1rem;
            font-family: 'Tajawal', sans-serif;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            background-color: var(--primary-color);
            color: white;
            transition: background-color 0.3s;
            width: 100%;
            margin-top: 0.5rem;
        }
        .btn-secondary {
            background-color: #6c757d;
        }
        .btn-secondary:hover {
            background-color: #5a6268;
        }
        .btn:disabled {
            background-color: #9e9e9e;
            cursor: not-allowed;
        }
        .btn:not(:disabled):hover {
            background-color: var(--primary-dark);
        }
        .loader {
            border: 4px solid var(--secondary-color);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 2rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error-message {
            color: var(--error-color);
            background-color: #ffebee;
            border: 1px solid var(--error-color);
            border-radius: 5px;
            padding: 1rem;
            margin-top: 1.5rem;
        }
        .survey-display {
            margin-top: 2rem;
        }
        .survey-title {
            text-align: center;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: var(--primary-dark);
        }
        .question-card {
            background-color: #fff;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .question-text {
            font-weight: 700;
            margin-bottom: 1rem;
        }
        .options-container div {
            margin-bottom: 0.5rem;
        }
        .options-container label {
            margin-right: 0.5rem;
            display: inline-flex;
            align-items: center;
        }
        .options-preview {
            margin-top: 0.75rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .option-button {
            background-color: var(--secondary-color);
            color: var(--text-color);
            padding: 0.4rem 1rem;
            border-radius: 15px;
            font-size: 0.9rem;
            border: 1px solid var(--border-color);
            cursor: pointer;
            font-family: 'Tajawal', sans-serif;
            transition: background-color 0.2s, color 0.2s, border-color 0.2s;
        }
        .option-button:hover {
            border-color: var(--primary-light);
        }
        .option-button.selected {
            background-color: var(--primary-dark);
            color: white;
            border-color: var(--primary-dark);
        }
        .text-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-family: 'Tajawal', sans-serif;
        }
        .likert-scale {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.5rem 0;
        }
        .likert-scale label {
           display: flex;
           flex-direction: column;
           align-items: center;
           text-align: center;
           font-size: 0.9rem;
           cursor: pointer;
        }
        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s;
        }
        .modal-content {
            background: var(--background-color);
            padding: 2rem;
            border-radius: 8px;
            width: 90%;
            max-width: 700px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
        }
        .modal-header h2 {
             color: var(--primary-dark);
        }
        .modal-header .close-button {
            background: none;
            border: none;
            font-size: 1.8rem;
            cursor: pointer;
            color: #888;
        }
        .responses-section {
            margin-top: 2.5rem;
        }
        .responses-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .responses-header h3 {
            color: var(--primary-dark);
            margin: 0;
        }
        .responses-header .btn-group {
            display: flex;
            gap: 0.5rem;
        }
        .table-container {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        th, td {
            border: 1px solid var(--border-color);
            padding: 0.75rem;
            text-align: center;
        }
        th {
            background-color: var(--secondary-color);
            font-weight: 700;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        .form-control {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-family: 'Tajawal', sans-serif;
            background-color: white;
        }
        .links-container {
            margin-top: 1.5rem;
            padding: 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: #f9f9fb;
        }
        .links-container .form-group {
            margin-bottom: 0.5rem;
        }
        .link-input-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .link-input-group input {
            background-color: #eef2f5;
            flex-grow: 1;
        }
        .copy-btn {
            padding: 0.5rem 1rem;
            background-color: var(--success-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 80px;
        }
        .survey-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
            background-color: var(--secondary-color);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
        }
        .survey-toolbar .btn, .survey-toolbar .btn-secondary {
            width: auto;
            margin-top: 0;
        }
        .status-indicator {
            font-weight: 700;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.9rem;
        }
        .status-indicator.open {
             background-color: #e8f5e9;
             color: var(--success-color);
        }
        .status-indicator.closed {
             background-color: #ffebee;
             color: var(--error-color);
        }
    `;
    return <style>{css}</style>;
};


// --- API HELPERS ---
const surveySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "عنوان الاستبيان" },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.NUMBER },
                    text: { type: Type.STRING, description: "نص السؤال" },
                    type: { type: Type.STRING, enum: ['single-choice', 'multiple-choice', 'likert-5', 'text'] },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['id', 'text', 'type']
            }
        }
    },
    required: ['title', 'questions']
};

const createSurveyFromText = async (text: string): Promise<Survey> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `أنت خبير في بناء استبيانات الأبحاث. قام المستخدم بتزويد النص التالي الذي يحتوي على أسئلة استبيان. مهمتك هي تحليل هذا النص وتحويله إلى تنسيق JSON منظم. القواعد: 1. حدد العنوان الرئيسي للاستبيان إن وجد. 2. لكل سؤال، حدد نوع السؤال الأنسب. الأنواع المدعومة هي: "single-choice", "multiple-choice", "likert-5", "text". 3. بالنسبة لنوع "likert-5"، يجب أن تكون الخيارات بالضبط: "لا أوافق بشدة", "لا أوافق", "محايد", "أوافق", "أوافق بشدة". 4. بالنسبة لأنواع "single-choice" و "multiple-choice"، استخرج الخيارات من النص. 5. بالنسبة لنوع "text"، هو سؤال مفتوح، لذا يجب أن تكون مصفوفة "options" فارغة. 6. التزم بصرامة بمخطط JSON المطلوب. النص هو: \`\`\`${text}\`\`\` قم بالرد فقط بكائن JSON.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: surveySchema },
    });

    const jsonString = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonString);
        parsedJson.questions.forEach((q: SurveyQuestion, index: number) => {
            if (!q.id) q.id = index + 1; // Ensure ID exists
            if (q.type === 'likert-5') q.options = ["لا أوافق بشدة", "لا أوافق", "محايد", "أوافق", "أوافق بشدة"];
        });
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse JSON:", e, jsonString);
        throw new Error("فشل الذكاء الاصطناعي في تكوين الاستبيان بشكل صحيح.");
    }
};

// --- COMPONENTS ---
const RespondentView: React.FC<{
    survey: Survey;
    onClose: () => void;
    onSubmit: (response: SurveyResponse) => void;
    isSurveyOpen: boolean;
}> = ({ survey, onClose, onSubmit, isSurveyOpen }) => {
    const [currentResponse, setCurrentResponse] = useState<SurveyResponse>({});

    const handleSelectOption = (questionId: number, selectedOption: string | string[]) => {
        setCurrentResponse(prev => ({
            ...prev,
            [`q-${questionId}`]: selectedOption
        }));
    };

    const handleSubmit = () => {
        const unansweredQuestions = survey.questions.filter(
            q => {
                const response = currentResponse[`q-${q.id}`];
                if (response === undefined) return true;
                if (typeof response === 'string' && response.trim() === '') return true;
                if (Array.isArray(response) && response.length === 0) return true;
                return false;
            }
        );

        if (unansweredQuestions.length > 0) {
            alert(`يرجى الإجابة على جميع الأسئلة قبل الإرسال. أول سؤال متبقي: "${unansweredQuestions[0].text}"`);
            return;
        }
        onSubmit(currentResponse);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{survey.title}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div>
                    {survey.questions.map(q => (
                       <div key={q.id} className="question-card" style={{backgroundColor: 'white'}}>
                            <p className="question-text">{q.id}. {q.text}</p>
                            {q.options && q.options.length > 0 && (
                                <div className="options-preview">
                                    {q.options.map((opt, i) => (
                                        <button 
                                            key={i} 
                                            className={`option-button ${currentResponse[`q-${q.id}`] === opt ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption(q.id, opt)}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {q.type === 'text' && (
                                <textarea 
                                    className="text-input" 
                                    rows={3} 
                                    placeholder="اكتب إجابتك هنا..."
                                    value={(currentResponse[`q-${q.id}`] as string) || ''}
                                    onChange={(e) => handleSelectOption(q.id, e.target.value)}
                                ></textarea>
                            )}
                        </div>
                    ))}
                </div>
                 {isSurveyOpen ? (
                    <button className="btn" onClick={handleSubmit} style={{marginTop: '1.5rem', backgroundColor: 'var(--success-color)'}}>
                        إرسال الرد
                    </button>
                 ) : (
                    <p style={{marginTop: '1.5rem', textAlign: 'center', color: 'var(--error-color)', fontWeight: 'bold', background: '#ffebee', padding: '1rem', borderRadius: '8px'}}>
                        هذا الاستبيان مغلق حالياً ولا يستقبل ردوداً جديدة.
                    </p>
                 )}
            </div>
        </div>
    );
};


const SurveyCreator: React.FC<{
    survey: Survey | null;
    responses: SurveyResponse[];
    setSurvey: (survey: Survey | null) => void;
    addResponse: (response: SurveyResponse) => void;
}> = ({ survey, responses, setSurvey, addResponse }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedLinks, setGeneratedLinks] = useState<{ editor: string; participant: string } | null>(null);
    const [currentResponse, setCurrentResponse] = useState<SurveyResponse>({});
    const [showRespondentView, setShowRespondentView] = useState(false);
    const [copiedLink, setCopiedLink] = useState<'editor' | 'participant' | null>(null);
    const [isSurveyOpen, setIsSurveyOpen] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
            setSurvey(null);
            setGeneratedLinks(null);
            setIsSurveyOpen(true);
        }
    };

    const handleProcess = useCallback(async () => {
        if (!file) return;
        setLoading(true); setError(null); setSurvey(null); setGeneratedLinks(null); setIsSurveyOpen(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setSurvey(await createSurveyFromText(e.target?.result as string));
            } catch (err: any) {
                setError(err.message || "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };
        reader.onerror = () => { setLoading(false); setError("Failed to read file."); };
        reader.readAsText(file);
    }, [file, setSurvey]);
    
    const handleSelectOption = (questionId: number, selectedOption: string) => {
        setCurrentResponse(prev => ({
            ...prev,
            [`q-${questionId}`]: selectedOption
        }));
    };

    const handleSubmitResponse = () => {
        if (!survey || Object.keys(currentResponse).length < survey.questions.length) {
            alert("يرجى الإجابة على جميع الأسئلة قبل الإرسال.");
            return;
        }
        addResponse(currentResponse);
        setCurrentResponse({});
    };

    const handleDownloadCSV = () => {
        if (!survey || responses.length === 0) return;

        const headers = survey.questions.map(q => `"${q.text.replace(/"/g, '""')}"`).join(',');
        
        const rows = responses.map(res => {
            return survey.questions.map(q => {
                const data = res[`q-${q.id}`];
                let cellData = getResponseValue(q, data);
                // Ensure cellData is a string before calling replace
                cellData = String(cellData).replace(/"/g, '""');
                return `"${cellData}"`;
            }).join(',');
        });

        const csvContent = `\uFEFF${headers}\n${rows.join('\n')}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "survey_responses.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleGenerateLinks = () => {
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const baseUrl = window.location.origin + window.location.pathname;
        setGeneratedLinks({
            editor: `${baseUrl}?editor_id=${uniqueId}`,
            participant: `${baseUrl}?survey_id=${uniqueId}`
        });
    };

    const handleCopy = (linkType: 'editor' | 'participant', text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedLink(linkType);
            setTimeout(() => setCopiedLink(null), 2000);
        });
    };
    
    const confirmDeleteSurvey = () => {
        setSurvey(null);
        setFile(null);
        setGeneratedLinks(null);
        setError(null);
        setCurrentResponse({});
        setShowDeleteConfirm(false);
    };

    const handleToggleSurveyStatus = () => {
        setIsSurveyOpen(prev => !prev);
    };


    const getResponseValue = (question: SurveyQuestion, responseValue: string | string[]): string | number => {
        if (typeof responseValue !== 'string') return responseValue.join(', ');
        if (question.type === 'likert-5' && question.options) {
            const index = question.options.indexOf(responseValue);
            return index !== -1 ? index + 1 : responseValue;
        }
        return responseValue;
    };

    const handleRespondentSubmit = (newResponse: SurveyResponse) => {
        addResponse(newResponse);
        setShowRespondentView(false);
    };
    
    return (
        <div className="section-content">
            {showRespondentView && survey && <RespondentView survey={survey} onClose={() => setShowRespondentView(false)} onSubmit={handleRespondentSubmit} isSurveyOpen={isSurveyOpen} />}
            
            {showDeleteConfirm && (
                <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" style={{maxWidth: '450px'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>تأكيد الحذف</h3>
                             <button onClick={() => setShowDeleteConfirm(false)} className="close-button">&times;</button>
                        </div>
                        <p>هل أنت متأكد من رغبتك في حذف هذا الاستبيان؟ سيتم فقدان جميع الأسئلة والردود بشكل دائم.</p>
                        <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                            <button onClick={confirmDeleteSurvey} className="btn" style={{backgroundColor: 'var(--error-color)'}}>نعم، احذف</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}


            <div className="uploader-container">
                <p>ارفع ملف الأسئلة بصيغة نص عادي (.txt) ليتم تحويله تلقائياً إلى استبيان.</p>
                <label htmlFor="file-upload" className="file-label">اختر ملف</label>
                <input id="file-upload" type="file" accept=".txt" onChange={handleFileChange} className="file-input" />
                {file && <p className="file-name">الملف المختار: {file.name}</p>}
            </div>
            
            <button onClick={handleProcess} disabled={!file || loading} className="btn">
                {loading ? '...جاري المعالجة' : 'معالجة وتكوين الاستبيان'}
            </button>
            
            {loading && <div className="loader"></div>}
            {error && <p className="error-message">{error}</p>}
            
            {survey && (
                <div className="survey-display">
                    <h2 className="survey-title">{survey.title}</h2>

                     <div className="survey-toolbar">
                        <span className={`status-indicator ${isSurveyOpen ? 'open' : 'closed'}`}>
                           الحالة: {isSurveyOpen ? 'مفتوح لاستقبال الردود' : 'مغلق'}
                        </span>
                        <button onClick={handleToggleSurveyStatus} className="btn btn-secondary">
                            {isSurveyOpen ? 'إغلاق الردود' : 'فتح الردود'}
                        </button>
                         <button className="btn btn-secondary" onClick={() => setShowRespondentView(true)}>
                            معاينة كَمُجيب
                        </button>
                        <button className="btn btn-secondary" onClick={handleGenerateLinks}>
                            توليد الروابط
                        </button>
                         <button onClick={() => setShowDeleteConfirm(true)} className="btn" style={{backgroundColor: 'var(--error-color)', marginRight: 'auto'}}>
                            حذف الاستبيان
                        </button>
                    </div>

                    {generatedLinks && (
                        <div className="links-container">
                            <div className="form-group">
                                <label>رابط المحرر:</label>
                                <div className="link-input-group">
                                    <input type="text" readOnly value={generatedLinks.editor} className="form-control" onClick={(e) => (e.target as HTMLInputElement).select()} />
                                     <button className="copy-btn" onClick={() => handleCopy('editor', generatedLinks.editor)}>
                                        {copiedLink === 'editor' ? 'تم النسخ!' : 'نسخ'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>رابط المشاركة:</label>
                                 <div className="link-input-group">
                                    <input type="text" readOnly value={generatedLinks.participant} className="form-control" onClick={(e) => (e.target as HTMLInputElement).select()} />
                                     <button className="copy-btn" onClick={() => handleCopy('participant', generatedLinks.participant)}>
                                        {copiedLink === 'participant' ? 'تم النسخ!' : 'نسخ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {survey.questions.map(q => (
                       <div key={q.id} className="question-card">
                            <p className="question-text">{q.id}. {q.text}</p>
                            {q.options && q.options.length > 0 && (
                                <div className="options-preview">
                                    {q.options.map((opt, i) => (
                                        <button 
                                            key={i} 
                                            className={`option-button ${currentResponse[`q-${q.id}`] === opt ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption(q.id, opt)}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <button className="btn" onClick={handleSubmitResponse} disabled={!isSurveyOpen} style={{backgroundColor: 'var(--success-color)'}}>
                        إرسال الإجابات (لإضافة رد جديد)
                    </button>
                </div>
            )}
            
            {responses.length > 0 && survey && (
                <div className="responses-section">
                    <div className="responses-header">
                        <h3>الردود التي تم جمعها ({responses.length})</h3>
                        <div className="btn-group">
                            <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{width: 'auto', marginTop: 0}}>تنزيل (CSV)</button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {survey.questions.map(q => <th key={q.id}>س{q.id}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {responses.map((res, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        {survey.questions.map(q => {
                                            const cellData = res[`q-${q.id}`];
                                            return <td key={q.id}>{getResponseValue(q, cellData)}</td>;
                                        })}
                                    </tr>
                                 ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- MAIN APP ---
const App: React.FC = () => {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);

    const addResponse = (response: SurveyResponse) => {
        setResponses(prev => [...prev, response]);
    };
    
    const handleSetSurvey = (newSurvey: Survey | null) => {
        setSurvey(newSurvey);
        setResponses([]);
    }

    return (
        <>
            <GlobalStyles />
            <div className="container">
                <header>
                    <h1>أداة بناء الاستبيانات البحثية</h1>
                </header>
                <main>
                    <SurveyCreator survey={survey} setSurvey={handleSetSurvey} responses={responses} addResponse={addResponse} />
                </main>
            </div>
        </>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
