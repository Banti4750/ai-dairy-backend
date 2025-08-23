import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Plus, Edit, Trash2, Save, X, Calendar, Heart, Smile, Meh, Frown, Zap, AlertCircle, ThumbsUp, Brain, Key, Download, Upload } from 'lucide-react';

// Zero-Knowledge Crypto Class
class ZeroKnowledgeCrypto {
    constructor(encryptionKey) {
        this.encryptionKey = encryptionKey;
    }

    // Generate a random encryption key (for initial setup)
    static generateEncryptionKey() {
        return crypto.getRandomValues(new Uint8Array(32));
    }

    // Convert Uint8Array to base64 string for storage
    static keyToBase64(key) {
        return btoa(String.fromCharCode.apply(null, key));
    }

    // Convert base64 string back to Uint8Array
    static base64ToKey(base64) {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }

    async importEncryptionKey() {
        this.encryptionKey = await crypto.subtle.importKey(
            'raw',
            this.encryptionKey,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async encryptData(data) {
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            this.encryptionKey,
            encoder.encode(JSON.stringify(data))
        );

        return {
            data: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }

    async decryptData(encryptedData) {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(encryptedData.iv)
            },
            this.encryptionKey,
            new Uint8Array(encryptedData.data)
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    async encryptContent(content) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }
        return await this.encryptData(content);
    }

    async decryptContent(encryptedContent) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }
        return await this.decryptData(encryptedContent);
    }

    async initialize() {
        await this.importEncryptionKey();
    }

    clearKey() {
        this.encryptionKey = null;
    }
}

const API_BASE = 'http://localhost:9000/api';

const EncryptedDiary = () => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [crypto, setCrypto] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Auth states
    const [isLogin, setIsLogin] = useState(true);
    const [showEncryptionKey, setShowEncryptionKey] = useState(false);
    const [authData, setAuthData] = useState({
        email: '',
        password: '',
        name: '',
        dob: '',
        gender: 'Other'
    });

    // Encryption key state
    const [encryptionKeyInput, setEncryptionKeyInput] = useState('');
    const [showKeySetup, setShowKeySetup] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [keyBackedUp, setKeyBackedUp] = useState(false);

    // Diary states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [diaryData, setDiaryData] = useState({
        title: '',
        content: '',
        mood: '',
        entryDate: new Date().toISOString().split('T')[0]
    });

    const cryptoRef = useRef(null);

    const moods = [
        { value: 'very_happy', label: 'Very Happy', icon: ThumbsUp, color: 'text-green-500' },
        { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-400' },
        { value: 'excited', label: 'Excited', icon: Zap, color: 'text-yellow-500' },
        { value: 'grateful', label: 'Grateful', icon: Heart, color: 'text-pink-500' },
        { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-500' },
        { value: 'anxious', label: 'Anxious', icon: Brain, color: 'text-orange-500' },
        { value: 'stressed', label: 'Stressed', icon: AlertCircle, color: 'text-red-400' },
        { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-500' },
        { value: 'very_sad', label: 'Very Sad', icon: Frown, color: 'text-blue-600' },
        { value: 'angry', label: 'Angry', icon: AlertCircle, color: 'text-red-600' }
    ];

    useEffect(() => {
        // Check if we have a token and encryption key in localStorage on component mount
        const storedToken = localStorage.getItem('token');
        const storedEncryptionKey = localStorage.getItem('encryptionKey');

        if (storedToken && storedEncryptionKey && !user) {
            // We have both token and key, so try to initialize the app
            initializeAppWithStoredCredentials(storedToken, storedEncryptionKey);
        } else if (storedToken && !storedEncryptionKey) {
            // We have a token but no key, so ask for the encryption key
            setToken(storedToken);
            setShowKeySetup(true);
        }
    }, []);

    // Add this useEffect to handle fetching entries after crypto is initialized
    useEffect(() => {
        if (crypto && user && token) {
            fetchDiaryEntries();
        }
    }, [crypto, user, token]); // Add dependencies here

    const initializeAppWithStoredCredentials = async (storedToken, storedEncryptionKey) => {
        setLoading(true);
        try {
            // First fetch user profile
            const response = await fetch(`${API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setToken(storedToken);

                // Then initialize crypto with the stored key
                const keyBytes = ZeroKnowledgeCrypto.base64ToKey(storedEncryptionKey);
                const newCrypto = new ZeroKnowledgeCrypto(keyBytes);
                cryptoRef.current = newCrypto;
                await newCrypto.initialize();
                setCrypto(newCrypto);

                // Diary entries will be fetched by the useEffect above
                // when crypto, user, and token are all set
            } else {
                // Token is invalid, clear everything
                logout();
            }
        } catch (err) {
            console.error('Initialization error:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (message, type = 'success') => {
        if (type === 'success') {
            setSuccess(message);
            setError('');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(message);
            setSuccess('');
            setTimeout(() => setError(''), 5000);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`${API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                logout();
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
            logout();
        }
    };

    const generateNewEncryptionKey = () => {
        const key = ZeroKnowledgeCrypto.generateEncryptionKey();
        const keyBase64 = ZeroKnowledgeCrypto.keyToBase64(key);
        setGeneratedKey(keyBase64);
        setEncryptionKeyInput(keyBase64);
        setKeyBackedUp(false);
        return keyBase64;
    };

    const downloadEncryptionKey = () => {
        const element = document.createElement('a');
        const file = new Blob([generatedKey], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'diary-encryption-key.txt';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setKeyBackedUp(true);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const body = isLogin
                ? { email: authData.email, password: authData.password }
                : authData;

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);

                showMessage(data.message);

                // For new users, show encryption key setup
                if (!isLogin) {
                    generateNewEncryptionKey();
                    setShowKeySetup(true);
                } else {
                    // For existing users, ask for encryption key
                    setShowKeySetup(true);
                }
            } else {
                showMessage(data.message, 'error');
            }
        } catch (err) {
            console.error('Auth error:', err);
            showMessage('Network error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setupEncryption = async () => {
        if (!encryptionKeyInput) {
            showMessage('Please enter your encryption key', 'error');
            return;
        }

        try {
            // Convert base64 key to Uint8Array
            const keyBytes = ZeroKnowledgeCrypto.base64ToKey(encryptionKeyInput);

            // Initialize crypto with the key
            const newCrypto = new ZeroKnowledgeCrypto(keyBytes);
            cryptoRef.current = newCrypto;
            await newCrypto.initialize();

            setCrypto(newCrypto);
            setShowKeySetup(false);

            // Store the key in localStorage (temporarily, until logout)
            localStorage.setItem('encryptionKey', encryptionKeyInput);

            showMessage('Encryption setup completed successfully');

            // Fetch diary entries after setting up encryption
            fetchDiaryEntries();
        } catch (err) {
            console.error('Encryption setup error:', err);
            showMessage('Invalid encryption key', 'error');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setCrypto(null);
        setEntries([]);
        localStorage.removeItem('token');
        localStorage.removeItem('encryptionKey'); // Remove key from storage
        if (cryptoRef.current) {
            cryptoRef.current.clearKey();
            cryptoRef.current = null;
        }
        showMessage('Logged out successfully');
    };

    const fetchDiaryEntries = async () => {
        if (!crypto) {
            console.error('Crypto not initialized');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/diary/entries`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Decrypt all entries
                const decryptedEntries = await Promise.all(
                    data.data.entries.map(async (entry) => {
                        try {
                            const title = await crypto.decryptContent(entry.encryptedTitle);
                            const content = await crypto.decryptContent(entry.encryptedContent);
                            const mood = entry.encryptedMood
                                ? await crypto.decryptContent(entry.encryptedMood)
                                : '';

                            return {
                                ...entry,
                                title,
                                content,
                                mood
                            };
                        } catch (err) {
                            console.error('Decryption error for entry:', entry._id, err);
                            return {
                                ...entry,
                                title: 'Decryption Error',
                                content: 'Unable to decrypt this entry. Please check your encryption key.',
                                mood: ''
                            };
                        }
                    })
                );

                setEntries(decryptedEntries);
            } else {
                showMessage('Failed to fetch diary entries', 'error');
            }
        } catch (err) {
            console.error('Fetch entries error:', err);
            showMessage('Network error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDiarySubmit = async (e) => {
        e.preventDefault();
        if (!crypto) return;

        setLoading(true);
        try {
            // Encrypt diary data
            const encryptedTitle = await crypto.encryptContent(diaryData.title);
            const encryptedContent = await crypto.encryptContent(diaryData.content);
            const encryptedMood = diaryData.mood
                ? await crypto.encryptContent(diaryData.mood)
                : null;

            const payload = {
                encryptedTitle,
                encryptedContent,
                entryDate: diaryData.entryDate
            };

            if (encryptedMood) {
                payload.encryptedMood = encryptedMood;
            }

            const url = editingEntry
                ? `${API_BASE}/diary/entries/${editingEntry._id}`
                : `${API_BASE}/diary/add`;

            const method = editingEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showMessage(editingEntry ? 'Entry updated successfully' : 'Entry created successfully');
                setDiaryData({ title: '', content: '', mood: '', entryDate: new Date().toISOString().split('T')[0] });
                setShowAddForm(false);
                setEditingEntry(null);
                fetchDiaryEntries();
            } else {
                const data = await response.json();
                showMessage(data.message, 'error');
            }
        } catch (err) {
            console.error('Diary submit error:', err);
            showMessage('Failed to save diary entry', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/diary/entries/${entryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showMessage('Entry deleted successfully');
                fetchDiaryEntries();
            } else {
                showMessage('Failed to delete entry', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showMessage('Network error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (entry) => {
        setDiaryData({
            title: entry.title,
            content: entry.content,
            mood: entry.mood,
            entryDate: entry.entryDate.split('T')[0]
        });
        setEditingEntry(entry);
        setShowAddForm(true);
    };

    const cancelEdit = () => {
        setDiaryData({ title: '', content: '', mood: '', entryDate: new Date().toISOString().split('T')[0] });
        setEditingEntry(null);
        setShowAddForm(false);
    };

    const getMoodDisplay = (moodValue) => {
        const mood = moods.find(m => m.value === moodValue);
        if (!mood) return null;

        const IconComponent = mood.icon;
        return (
            <div className={`flex items-center gap-2 ${mood.color}`}>
                <IconComponent className="w-4 h-4" />
                <span>{mood.label}</span>
            </div>
        );
    };

    // Encryption Key Setup Component
    const EncryptionKeySetup = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                        <Key className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {isLogin ? 'Enter Encryption Key' : 'Setup Encryption Key'}
                    </h2>
                    <p className="text-gray-600">
                        {isLogin
                            ? 'Please enter your encryption key to access your diary'
                            : 'This key will encrypt all your diary entries. Save it securely!'
                        }
                    </p>
                </div>

                {!isLogin && generatedKey && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                        <div className="font-semibold mb-2">⚠️ Important: Save Your Key</div>
                        <p className="text-sm">
                            This key is required to decrypt your diary entries. If you lose it,
                            you will lose access to all your data.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={downloadEncryptionKey}
                                className="flex items-center gap-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download Key
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey);
                                    showMessage('Key copied to clipboard');
                                }}
                                className="border border-yellow-600 text-yellow-600 px-3 py-1 rounded text-sm"
                            >
                                Copy Key
                            </button>
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Encryption Key
                    </label>
                    <div className="relative">
                        <input
                            type={showEncryptionKey ? "text" : "password"}
                            value={encryptionKeyInput}
                            onChange={(e) => setEncryptionKeyInput(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                            placeholder="Enter your encryption key"
                        />
                        <button
                            type="button"
                            onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                        >
                            {showEncryptionKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {!isLogin && (
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="keyBackedUp"
                            checked={keyBackedUp}
                            onChange={(e) => setKeyBackedUp(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="keyBackedUp" className="ml-2 block text-sm text-gray-700">
                            I have securely saved my encryption key
                        </label>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={setupEncryption}
                        disabled={!encryptionKeyInput || (!isLogin && !keyBackedUp)}
                        className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {isLogin ? 'Decrypt Diary' : 'Continue'}
                    </button>

                    {!isLogin && (
                        <button
                            onClick={generateNewEncryptionKey}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Regenerate
                        </button>
                    )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                    <p>🔐 This key is used to encrypt your data locally before it's sent to the server.</p>
                    <p>🗝️ The server never sees your encryption key or unencrypted data.</p>
                </div>
            </div>
        </div>
    );

    // Auth Form Component
    const AuthForm = () => (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🔐 Encrypted Diary
                    </h1>
                    <p className="text-gray-600">Your thoughts, completely private</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                required={!isLogin}
                                value={authData.name}
                                onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={authData.email}
                            onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={authData.password}
                            onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter your password"
                            minLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth (Optional)</label>
                                <input
                                    type="date"
                                    value={authData.dob}
                                    onChange={(e) => setAuthData({ ...authData, dob: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                <select
                                    value={authData.gender}
                                    onChange={(e) => setAuthData({ ...authData, gender: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                </div>

                <div className="mt-6 text-xs text-gray-500 text-center">
                    🔐 All your data is encrypted end-to-end. Even we cannot read your entries.
                </div>
            </div>
        </div>
    );

    // Main App Component
    if (!user) {
        return <AuthForm />;
    }

    if (showKeySetup) {
        return <EncryptionKeySetup />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🔐 My Encrypted Diary</h1>
                        <p className="text-gray-600">Welcome back, {user.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Entry
                        </button>
                        <button
                            onClick={logout}
                            className="text-gray-600 hover:text-gray-800 px-4 py-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Messages */}
            {error && (
                <div className="max-w-4xl mx-auto px-4 pt-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                </div>
            )}

            {success && (
                <div className="max-w-4xl mx-auto px-4 pt-4">
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingEntry ? 'Edit Entry' : 'New Diary Entry'}
                                </h2>
                                <button
                                    onClick={cancelEdit}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleDiarySubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={diaryData.title}
                                        onChange={(e) => setDiaryData({ ...diaryData, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="What's on your mind?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {moods.map((mood) => {
                                            const IconComponent = mood.icon;
                                            return (
                                                <button
                                                    key={mood.value}
                                                    type="button"
                                                    onClick={() => setDiaryData({ ...diaryData, mood: diaryData.mood === mood.value ? '' : mood.value })}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${diaryData.mood === mood.value
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <IconComponent className={`w-4 h-4 ${mood.color}`} />
                                                    <span className="text-sm">{mood.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={diaryData.entryDate}
                                        onChange={(e) => setDiaryData({ ...diaryData, entryDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your thoughts</label>
                                    <textarea
                                        required
                                        rows={8}
                                        value={diaryData.content}
                                        onChange={(e) => setDiaryData({ ...diaryData, content: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Write your thoughts here... Everything you write is encrypted and completely private."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Save Entry')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {loading && !showAddForm && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="mt-2 text-gray-600">Loading your entries...</p>
                    </div>
                )}

                {!loading && entries.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Calendar className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No diary entries yet</h3>
                        <p className="text-gray-500 mb-6">Start writing your encrypted diary today!</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Write First Entry
                        </button>
                    </div>
                )}

                {/* Diary Entries */}
                <div className="space-y-6">
                    {entries.map((entry) => (
                        <div key={entry._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{entry.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(entry.entryDate).toLocaleDateString()}
                                            </div>
                                            {entry.mood && getMoodDisplay(entry.mood)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(entry)}
                                            className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEntry(entry._id)}
                                            className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="prose prose-gray max-w-none">
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {entry.content}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span>🔐 End-to-end encrypted</span>
                                        <span>
                                            {entry.createdAt !== entry.updatedAt
                                                ? `Updated ${new Date(entry.updatedAt).toLocaleString()}`
                                                : `Created ${new Date(entry.createdAt).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <div className="text-2xl mb-4">🔐</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Your Privacy is Our Priority
                        </h3>
                        <p className="text-gray-600 mb-4">
                            All your diary entries are encrypted end-to-end using AES-256 encryption.
                            <br />
                            Your encryption key is stored locally and never sent to our servers.
                        </p>
                        <div className="flex justify-center space-x-8 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Client-Side Encryption</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>AES-256 Security</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Zero-Knowledge Architecture</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Encryption Status Indicator */}
            <div className="fixed bottom-4 right-4">
                <div className="bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Encryption Active</span>
                </div>
            </div>
        </div>
    );
};

export default EncryptedDiary;