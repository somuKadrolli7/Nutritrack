'use client';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Heart, Mic, Camera, Upload, Barcode, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getCalorieGoal, todayStr } from '@/lib/utils';

const CATEGORIES = [
  { key: 'all',           label: 'All' },
  { key: 'favorites',     label: '❤️ Favorites' },
  { key: 'indian_common', label: 'Indian' },
  { key: 'south_indian',  label: 'South Indian' },
  { key: 'north_indian',  label: 'North Indian' },
  { key: 'gym',           label: 'Gym Foods' },
  { key: 'fruit',         label: 'Fruits' },
  { key: 'vegetable',     label: 'Vegetables' },
  { key: 'dairy',         label: 'Dairy' },
  { key: 'snack',         label: 'Snacks' },
  { key: 'beverage',      label: 'Beverages' },
];

const MEAL_SLOTS = [
  { key: 'breakfast', label: '🌅 Breakfast' },
  { key: 'lunch',     label: '☀️ Lunch' },
  { key: 'dinner',    label: '🌙 Dinner' },
  { key: 'snack',     label: '🍎 Snack' },
];

export default function NutritionPage() {
  const { user } = useAuthStore();
  const [foods, setFoods] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [summary, setSummary] = useState<any>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [mealSlot, setMealSlot] = useState('breakfast');
  const [quantity, setQuantity] = useState(1);
  
  // Camera, Upload, Barcode states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [recognizedFoods, setRecognizedFoods] = useState<any[]>([]);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const calGoal = user ? getCalorieGoal(user) : 2178;
  const remaining = Math.max(0, calGoal - summary.calories);

  // Load foods
  useEffect(() => {
    const load = async () => {
      try {
        if (category === 'favorites') {
          const res = await api.get('/meals/favorites');
          setFoods(res.data.favorites || []);
        } else {
          const params: any = {};
          if (search) params.q = search;
          if (category !== 'all') params.category = category;
          const res = await api.get('/meals/search', { params });
          setFoods(res.data.foods || []);
        }
      } catch {
        // Fallback: try featured
        try {
          const res = await api.get('/meals/featured');
          setFoods(res.data.foods || []);
        } catch { }
      }
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  // Load summary + weekly stats + favorites
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [sumRes, weekRes, favRes] = await Promise.all([
          api.get(`/meals/summary?date=${todayStr()}`),
          api.get('/meals/weekly-stats'),
          api.get('/meals/favorites'),
        ]);
        setSummary(sumRes.data.summary || { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setWeeklyStats(weekRes.data.stats || []);
        setFavorites((favRes.data.favorites || []).map((f: any) => f._id));
      } catch { }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.nut-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [foods, summary, weeklyStats]);

  useEffect(() => {
    if (showCameraModal && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCameraModal]);

  useEffect(() => {
    let html5QrcodeScanner: any = null;
    
    if (showBarcodeModal) {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        // Wait for next tick so the DOM element is definitely mounted
        setTimeout(() => {
          html5QrcodeScanner = new Html5QrcodeScanner(
            "barcode-reader",
            { fps: 10, qrbox: { width: 250, height: 100 } },
            false
          );
          
          html5QrcodeScanner.render(
            (decodedText: string) => {
              html5QrcodeScanner.clear();
              setBarcodeInput(decodedText);
              setCameraLoading(true);
              
              api.get(`/meals/barcode/${decodedText}`)
                .then(res => {
                  if (res.data.foods && res.data.foods.length > 0) {
                    setSelectedFood(res.data.foods[0]);
                    setBarcodeInput('');
                    setShowBarcodeModal(false);
                  } else {
                    alert('Barcode not found in our database. Try searching manually.');
                  }
                })
                .catch((err: any) => {
                  console.error('Barcode lookup failed:', err);
                  alert(err?.response?.data?.error || err?.message || 'Failed to lookup barcode.');
                })
                .finally(() => {
                  setCameraLoading(false);
                });
            },
            (error: any) => {
              // Ignore scan errors
            }
          );
        }, 100);
      });
    }

    return () => {
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.clear().catch((e: any) => console.error(e));
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [showBarcodeModal]);

  const toggleFav = async (foodId: string) => {
    try {
      const res = await api.post(`/meals/favorites/${foodId}`);
      if (res.data.favorited) {
        setFavorites(prev => [...prev, foodId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== foodId));
      }
    } catch { }
  };

  const addMeal = async () => {
    if (!selectedFood) return;
    try {
      setIsAddingMeal(true);
      await api.post('/meals', {
        date: todayStr(),
        mealType: mealSlot,
        foods: [{
          foodId: selectedFood._id,
          name: selectedFood.name,
          quantity,
          calories: selectedFood.calories * quantity,
          protein: selectedFood.protein * quantity,
          carbs: selectedFood.carbs * quantity,
          fat: selectedFood.fat * quantity,
        }],
      });
      // Refresh summary
      const sumRes = await api.get(`/meals/summary?date=${todayStr()}`);
      setSummary(sumRes.data.summary || { calories: 0, protein: 0, carbs: 0, fat: 0 });
      setSelectedFood(null);
      setQuantity(1);
    } catch (err: any) {
      console.error('Failed to add meal:', err);
      alert(err?.response?.data?.error || err?.message || 'Failed to add meal.');
    } finally {
      setIsAddingMeal(false);
    }
  };

  // Camera handler
  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setShowCameraModal(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access denied. Please enable camera permissions.');
      setCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      await processImage(blob);
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
    setCameraLoading(false);
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Native client-side image compression
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          
          const MAX_SIZE = 800;
          let { width, height } = img;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      });

      await processImage(compressedBlob, true);
    } catch (err) {
      console.error(err);
      alert('Failed to process image');
      setIsUploading(false);
    }
  };

  // Process image (send to backend for AI recognition)
  const processImage = async (imageBlob: Blob, fromUpload = false) => {
    const formData = new FormData();
    formData.append('image', imageBlob);
    
    try {
      if (!fromUpload) setCameraLoading(true);
      const res = await api.post('/meals/recognize-food', formData);
      
      if (res.data.foods && res.data.foods.length > 0) {
        setRecognizedFoods(res.data.foods);
        // Auto-select first recognized food
        setSelectedFood(res.data.foods[0]);
      } else {
        alert('No foods recognized from the image. Try another photo.');
      }
    } catch (err: any) {
      console.error('Food recognition failed:', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to recognize food from image.';
      alert(message);
    } finally {
      if (fromUpload) setIsUploading(false);
      else setCameraLoading(false);
    }
  };

  // Barcode scanner handler
  const handleBarcodeSubmit = async () => {
    if (!barcodeInput.trim()) return;
    
    try {
      setCameraLoading(true);
      const res = await api.get(`/meals/barcode/${barcodeInput}`);
      
      if (res.data.foods && res.data.foods.length > 0) {
        setSelectedFood(res.data.foods[0]);
        setBarcodeInput('');
        setShowBarcodeModal(false);
      } else {
        alert('Barcode not found in our database. Try searching manually.');
      }
    } catch (err: any) {
      console.error('Barcode lookup failed:', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to lookup barcode.';
      alert(message);
    } finally {
      setCameraLoading(false);
    }
  };

  const calPct = Math.min(100, Math.round((summary.calories / calGoal) * 100));
  const pGoal = Math.round((calGoal * 0.3) / 4);
  const cGoal = Math.round((calGoal * 0.4) / 4);
  const fGoal = Math.round((calGoal * 0.3) / 9);

  if (!user) return null;

  return (
    <div ref={containerRef} className="flex gap-6 pb-12 text-white min-h-screen">

      {/* LEFT SIDEBAR */}
      <div className="hidden lg:flex flex-col gap-6 w-[280px] flex-shrink-0">

        {/* Calories Ring */}
        <div className="nut-card bg-[#111118] p-6 rounded-2xl border border-white/5 flex flex-col items-center">
          <h3 className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Calories Today</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" strokeLinecap="round" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="#7c3aed" strokeWidth="14" strokeLinecap="round"
                strokeDasharray="377" strokeDashoffset={377 - (377 * calPct) / 100}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="text-center z-10">
              <div className="text-3xl font-black">{remaining}</div>
              <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Remaining</div>
            </div>
          </div>
          <div className="flex justify-between w-full mt-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-white">{Math.round(summary.calories)}</div>
              <div className="text-[10px] text-gray-500">Eaten</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">{calGoal}</div>
              <div className="text-[10px] text-gray-500">Goal</div>
            </div>
          </div>
        </div>

        {/* Macros Split */}
        <div className="nut-card bg-[#111118] p-6 rounded-2xl border border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Macros Split</h3>
          {summary.calories > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-400 font-bold">Protein</span>
                  <span className="text-gray-500">{Math.round(summary.protein)}g / {pGoal}g</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (summary.protein / pGoal) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-yellow-400 font-bold">Carbs</span>
                  <span className="text-gray-500">{Math.round(summary.carbs)}g / {cGoal}g</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${Math.min(100, (summary.carbs / cGoal) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-bold">Fat</span>
                  <span className="text-gray-500">{Math.round(summary.fat)}g / {fGoal}g</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.min(100, (summary.fat / fGoal) * 100)}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Log meals to see macros</p>
          )}
        </div>

        {/* 7-Day Calories */}
        <div className="nut-card bg-[#111118] p-6 rounded-2xl border border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">7-Day Calories</h3>
          {weeklyStats.length > 0 ? (
            <div className="w-full h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStats}>
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  />
                  <Bar dataKey="calories" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No data yet</p>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Search Bar */}
        <div className="nut-card flex items-center gap-2 bg-[#111118] px-5 py-3 rounded-2xl border border-white/5">
          <Search size={18} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search foods — Dosa, Banana, Chicken, Whey..."
            className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-sm"
          />
          
          {/* Quick action buttons */}
          <button onClick={startCamera} disabled={cameraLoading} className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
            <Camera size={16} />
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} disabled={cameraLoading} className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
            <Upload size={16} />
          </button>
          
          <button onClick={() => setShowBarcodeModal(true)} className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <Barcode size={16} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Category Filters */}
        <div className="nut-card flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                category === cat.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-[#111118] text-gray-400 border border-white/5 hover:text-white hover:border-white/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {foods.map((food) => (
            <div
              key={food._id}
              onClick={() => setSelectedFood(food)}
              className="nut-card flex items-center justify-between px-5 py-4 bg-[#111118] rounded-2xl border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">{food.emoji || '🍽️'}</span>
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{food.name}</div>
                  <div className="text-xs text-green-400 font-medium">{food.category?.replace(/_/g, ' ')}</div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(food._id); }}
                className="flex-shrink-0 p-1 transition-all"
              >
                <Heart
                  size={18}
                  className={favorites.includes(food._id) ? 'fill-red-500 text-red-500' : 'text-gray-600 group-hover:text-gray-400'}
                />
              </button>
            </div>
          ))}
        </div>

        {foods.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No foods found. Try a different search or category.
          </div>
        )}
      </div>

      {/* ADD MEAL MODAL */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedFood(null)}>
          <div
            className="bg-[#111118] border border-white/10 rounded-2xl p-8 max-w-md w-full space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{selectedFood.emoji || '🍽️'}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedFood.name}</h2>
                <p className="text-sm text-gray-400">{selectedFood.servingLabel || '1 serving (100g)'}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-bold text-purple-400">{Math.round(selectedFood.calories * quantity)}</div>
                <div className="text-[10px] text-gray-500">kcal</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-bold text-blue-400">{Math.round(selectedFood.protein * quantity)}g</div>
                <div className="text-[10px] text-gray-500">Protein</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-bold text-yellow-400">{Math.round(selectedFood.carbs * quantity)}g</div>
                <div className="text-[10px] text-gray-500">Carbs</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-bold text-red-400">{Math.round(selectedFood.fat * quantity)}g</div>
                <div className="text-[10px] text-gray-500">Fat</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meal Slot</label>
              <div className="flex gap-2 mt-2">
                {MEAL_SLOTS.map((slot) => (
                  <button
                    key={slot.key}
                    onClick={() => setMealSlot(slot.key)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      mealSlot === slot.key
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Servings</label>
              <div className="flex items-center gap-4 mt-2">
                <button onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))} className="w-10 h-10 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all">−</button>
                <span className="text-2xl font-bold text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 0.5)} className="w-10 h-10 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all">+</button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedFood(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button disabled={isAddingMeal} onClick={addMeal} className={`flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:opacity-90 transition-all ${isAddingMeal ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isAddingMeal ? 'Adding...' : `+ Add to ${mealSlot}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden max-w-md w-full space-y-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">📷 Take Photo</h3>
              <button onClick={stopCamera} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex gap-3">
              <button onClick={stopCamera} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={capturePhoto} disabled={cameraLoading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50">
                {cameraLoading ? 'Processing...' : 'Capture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE MODAL */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBarcodeModal(false)}>
          <div
            className="bg-[#111118] border border-white/10 rounded-2xl p-8 max-w-md w-full space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🔍 Barcode Scanner</h2>
              <button onClick={() => setShowBarcodeModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Camera Scanner View */}
            <div id="barcode-reader" className="w-full rounded-xl overflow-hidden bg-black mb-4 [&_video]:w-full [&_video]:rounded-xl [&_#barcode-reader__dashboard_section_csr]:hidden"></div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Or Enter Barcode Manually</label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
                placeholder="e.g., 8901234567890"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowBarcodeModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleBarcodeSubmit} disabled={cameraLoading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50">
                {cameraLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD PROCESSING MODAL */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-3xl overflow-hidden max-w-sm w-full p-8 flex flex-col items-center justify-center shadow-2xl">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Upload size={32} className="animate-pulse text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Analyzing Image...</h3>
            <p className="text-sm text-gray-400 text-center mt-2 leading-relaxed">
              Our AI is magically identifying your food and its macros. This takes just a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
