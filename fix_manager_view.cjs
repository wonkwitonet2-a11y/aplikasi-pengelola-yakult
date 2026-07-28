const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

// 1. Remove states
content = content.replace(/const \[chatbotNameSaved, setChatbotNameSaved\] = useState<boolean>\(false\);\n/, '');
content = content.replace(/const \[tkuNameSaved, setTkuNameSaved\] = useState<boolean>\(false\);\n/, '');

// 2. Remove functions
content = content.replace(/const handleSaveChatbotName = async \(\) => \{[\s\S]*?catch \(e: any\) \{\n\s*alert\("Gagal menyimpan nama Chatbot AI: " \+ e\.message\);\n\s*\}\n\s*\};\n/, '');
content = content.replace(/const handleSaveTkuName = async \(\) => \{[\s\S]*?catch \(e: any\) \{\n\s*alert\("Gagal menyimpan nama TKU: " \+ e\.message\);\n\s*\}\n\s*\};\n/, '');

// 3. Update buttons and remove notifications
const chatbotBtnRegex = /<button\n\s*onClick=\{handleSaveChatbotName\}[\s\S]*?<\/button>\n\s*<\/div>\n\s*\{chatbotNameSaved && \([\s\S]*?\}\)/;
const chatbotBtnReplacement = `<button
                    onClick={() => {
                      const newName = chatbotNameInput.trim() || "AI Jember 1 Pro";
                      onUpdateMotivasi({ ...motivasiConfig, chatbotName: newName });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    💾 Simpan Nama
                  </button>
                </div>`;
content = content.replace(chatbotBtnRegex, chatbotBtnReplacement);

const tkuBtnRegex = /<button\n\s*onClick=\{handleSaveTkuName\}[\s\S]*?<\/button>\n\s*<\/div>\n\s*\{tkuNameSaved && \([\s\S]*?\}\)/;
const tkuBtnReplacement = `<button
                    onClick={() => {
                      const newName = tkuNameInput.trim() || "DP Jember 1";
                      onUpdateMotivasi({ ...motivasiConfig, tkuName: newName });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    💾 Simpan TKU
                  </button>
                </div>`;
content = content.replace(tkuBtnRegex, tkuBtnReplacement);

fs.writeFileSync('src/components/ManagerView.tsx', content);
