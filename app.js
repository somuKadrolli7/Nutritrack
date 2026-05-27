// js/app.js
const root = document.getElementById('root');

/* ---------- Utilities ---------- */
const uid = () => Math.random().toString(36).slice(2,9);
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const load = k => JSON.parse(localStorage.getItem(k) || 'null');

/* ---------- Data stores (sample) ---------- */
let users = load('nt_users') || [];              // persisted users
let currentUserId = load('nt_current') || null;  // logged in user id

// Food & nutrient sample database (expandable)
const FOOD_DB = [
  { id: uid(), name: 'Apple', category: 'Fruits', calories: 52, carbs: 14, protein: 0.3, fat: 0.2, vitamins: 'C, K' },
  { id: uid(), name: 'Banana', category: 'Fruits', calories: 96, carbs: 27, protein: 1.3, fat: 0.3, vitamins: 'B6, C' },
  { id: uid(), name: 'Broccoli', category: 'Vegetables', calories: 34, carbs: 7, protein: 2.8, fat: 0.4, vitamins: 'C, K' },
  { id: uid(), name: 'Chicken Breast (100g)', category: 'Proteins', calories: 165, carbs: 0, protein: 31, fat: 3.6, vitamins: 'B3, B6' },
  { id: uid(), name: 'Brown Rice (100g)', category: 'Grains', calories: 123, carbs: 25.6, protein: 2.6, fat: 1, vitamins: 'B' },
  { id: uid(), name: 'Milk (200ml)', category: 'Dairy', calories: 122, carbs: 12, protein: 6.6, fat: 4.8, vitamins: 'A, D' }
];

// Exercises sample
const EXERCISES = [
  { id: uid(), name: 'Brisk Walking', calories_per_30min: 150, desc: 'Good for beginners — low impact.' , img: 'https://images.unsplash.com/photo-1554288249-ef5b40d5f2a3?auto=format&fit=crop&w=800&q=60' },
  { id: uid(), name: 'Jogging', calories_per_30min: 250, desc: 'Moderate intensity cardio.' , img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=60'},
  { id: uid(), name: 'Push-ups', calories_per_15min: 100, desc: 'Bodyweight strength for chest and triceps.' , img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=60' }
];

/* ---------- Health math ---------- */
function calcBMI(weightKg, heightCm){
  if(!weightKg || !heightCm) return null;
  return +(weightKg / ((heightCm/100)**2)).toFixed(1);
}
function bmiCategory(bmi){
  if(bmi === null) return {cat:'-', color:'#6b7280'};
  if(bmi < 18.5) return {cat:'Underweight', color:'#fb923c'};
  if(bmi < 25) return {cat:'Normal', color:'#16a34a'};
  if(bmi < 30) return {cat:'Overweight', color:'#f59e0b'};
  return {cat:'Obese', color:'#ef4444'};
}
function calcBMR(weight, height, age, gender){
  if(gender === 'male'){
    return 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age);
  } else {
    return 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
  }
}
function calcTDEE(bmr, activityFactor=1.2){ return bmr * activityFactor; }

/* ---------- Render helpers ---------- */
function mount(html){
  root.innerHTML = `<div class="app fade">${html}</div>`;
}


function navBar(){
  return `
    <div class="nav">
      <div class="brand">NutriTrack</div>
      <div class="menu">
      <button id="themeToggle">🌓</button>

        <button id="nav-dashboard">Dashboard</button>
        <button id="nav-food">Food</button>
        <button id="nav-ex">Exercises</button>
        <button id="nav-health">Health</button>
        <button id="nav-profile">Profile</button>
        <button id="nav-logout">Logout</button>
      </div>
    </div>
  `;
}

/* ---------- Auth Screens ---------- */
function renderAuth(login = true){
  const leftBg = login
    ? "https://images.unsplash.com/photo-1554299045-1e8149f0e6d6?auto=format&fit=crop&w=1600&q=60"
    : "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1600&q=60";

  mount(`
    <div class="auth-screen">
      <div class="auth-left" style="background-image: linear-gradient(150deg, rgba(0,0,0,0.25), rgba(0,0,0,0.06) ), url('${leftBg}');">
        <h1>NutriTrack</h1>
        <p style="max-width:360px;margin-top:14px;">
          Smart nutrition & fitness tracker. Personalized plans, clear metrics and simple guidance.
        </p>
      </div>

      <div class="auth-right card">
        ${login ? `
          <h2>Login</h2>
          <form id="frmLogin" class="form">
            <input id="liEmail" placeholder="Email" type="email" required />
            <input id="liPass" placeholder="Password" type="password" required />
            <button type="submit">Login</button>
            <div class="small-muted">No account? <a id="toRegister" href="#">Create one</a></div>
          </form>
        ` : `
          <h2>Create Account</h2>
          <form id="frmReg" class="form">
            <input id="rName" placeholder="Full name" required />
            <input id="rEmail" placeholder="Email" type="email" required />
            <input id="rPass" placeholder="Password" type="password" required />
            <div style="display:flex;gap:8px">
              <input id="rAge" placeholder="Age" type="number" min="8" />
              <input id="rWeight" placeholder="Weight (kg)" type="number" min="10" />
              <input id="rHeight" placeholder="Height (cm)" type="number" min="60" />
            </div>
            <select id="rGender" required>
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <button type="submit">Register</button>
            <div class="small-muted">Already have account? <a id="toLogin" href="#">Login</a></div>
          </form>
        `}
      </div>
    </div>
  `);

  if(login){
    document.getElementById('frmLogin').addEventListener('submit', e=>{
      e.preventDefault();
      const email = document.getElementById('liEmail').value.trim().toLowerCase();
      const pass = document.getElementById('liPass').value;
      const u = users.find(x => x.email === email && x.password === pass);
      if(u){
        currentUserId = u.id;
        save('nt_current', currentUserId);
        renderDashboard();
      } else {
        alert('Invalid credentials. Try test user: test@demo / test123');
      }
    });
    if(document.getElementById('toRegister')) document.getElementById('toRegister').addEventListener('click', e=>{e.preventDefault(); renderAuth(false)});
  } else {
    document.getElementById('frmReg').addEventListener('submit', e=>{
      e.preventDefault();
      const newU = {
        id: uid(),
        name: document.getElementById('rName').value.trim(),
        email: document.getElementById('rEmail').value.trim().toLowerCase(),
        password: document.getElementById('rPass').value,
        age: Number(document.getElementById('rAge').value || 0),
        weight: Number(document.getElementById('rWeight').value || 0),
        height: Number(document.getElementById('rHeight').value || 0),
        gender: document.getElementById('rGender').value,
        activity: 1.2,
        goal: 'maintenance'
      };
      if(users.some(x => x.email === newU.email)){ alert('Email already used'); return; }
      users.push(newU); save('nt_users', users);
      alert('Registered — now login');
      renderAuth(true);
    });
    if(document.getElementById('toLogin')) document.getElementById('toLogin').addEventListener('click', e=>{e.preventDefault(); renderAuth(true)});
  }
}

/* ---------- Dashboard ---------- */
function renderDashboard(){
  const user = users.find(u=>u.id === currentUserId);
  if(!user){ renderAuth(true); return; }

  // health calculations
  const bmi = calcBMI(user.weight, user.height);
  const cat = bmiCategory(bmi);
  const bmr = calcBMR(user.weight, user.height, user.age, user.gender);
  const tdee = calcTDEE(bmr, user.activity || 1.2);
  const recCalories = Math.round(tdee + (user.goal === 'lose' ? -300 : user.goal === 'gain' ? 300 : 0));

  mount(`
    ${navBar()}
    <div class="layout">
      <div class="sidebar card">
        <div style="font-weight:700">${user.name}</div>
        <div class="small-muted" style="margin-top:6px">${user.email}</div>
        <hr style="margin:10px 0" />
        <div class="side-item" id="menu-dashboard">Overview</div>
        <div class="side-item" id="menu-diet">Diet Planner</div>
        <div class="side-item" id="menu-food">Food Database</div>
        <div class="side-item" id="menu-ex">Exercises</div>
        <div class="side-item" id="menu-health">Health Info</div>
        <div style="height:8px"></div>
        <div class="side-item" id="menu-profile">Profile</div>
      </div>

      <div>
        <div class="card header-row">
          <div>
            <h2>Welcome back, ${user.name.split(' ')[0]}</h2>
            <div class="small-muted">Track your progress and get a personalized plan</div>
          </div>
          <div style="text-align:right">
            <div class="small-muted">Daily target</div>
            <div style="font-weight:700;font-size:18px">${recCalories} kcal</div>
          </div>
        </div>

        <div class="grid-3">
          <div class="card-small card">
            <div style="font-size:13px" class="small-muted">BMI</div>
            <div style="font-size:20px;font-weight:700;color:${cat.color}">${bmi || '-'}</div>
            <div class="small-muted" style="font-size:13px">${cat.cat}</div>
          </div>
          <div class="card-small card">
            <div class="small-muted">BMR</div>
            <div style="font-weight:700">${Math.round(bmr)} kcal</div>
            <div class="small-muted">Basal metabolic rate</div>
          </div>
          <div class="card-small card">
            <div class="small-muted">TDEE</div>
            <div style="font-weight:700">${Math.round(tdee)} kcal</div>
            <div class="small-muted">Total daily energy expenditure</div>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-top:14px">
          <div class="card" style="flex:1">
            <h3>Weekly Progress</h3>
            <div class="chart-wrap"><canvas id="chartWeek"></canvas></div>
          </div>

          <div class="card" style="width:360px">
            <h3>Quick Actions</h3>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
              <button id="btn-generate">Generate Diet Plan</button>
              <button id="btn-view-food">Open Food Database</button>
              <button id="btn-ex">Exercise Suggestions</button>
            </div>
          </div>
        </div>

        <div id="panel-area" style="margin-top:12px"></div>
      </div>
    </div>
  `);

  // chart (dummy progress)
  const ctx = document.getElementById('chartWeek').getContext('2d');
  new Chart(ctx, {
    type:'line',
    data:{
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[{
        label:'Calories Consumed',
        data: [recCalories-200, recCalories-50, recCalories+100, recCalories-300, recCalories, recCalories+50, recCalories-150],
        fill:false,
        tension:0.3,
      }]
    },
    options:{plugins:{legend:{display:false}}}
  });

  // handlers
  document.getElementById('menu-diet').onclick = ()=> renderDietGenerator(user);
  document.getElementById('menu-food').onclick = ()=> renderFoodDB();
  document.getElementById('menu-ex').onclick = ()=> renderExercises();
  document.getElementById('menu-health').onclick = ()=> renderHealthInfo();
  document.getElementById('menu-profile').onclick = ()=> renderProfile(user);

  document.getElementById('btn-generate').onclick = ()=> renderDietGenerator(user);
  document.getElementById('btn-view-food').onclick = ()=> renderFoodDB();
  document.getElementById('btn-ex').onclick = ()=> renderExercises();

  // top nav handlers
  document.getElementById('nav-dashboard').onclick = renderDashboard;
  document.getElementById('nav-food').onclick = renderFoodDB;
  document.getElementById('nav-ex').onclick = renderExercises;
  document.getElementById('nav-health').onclick = renderHealthInfo;
  document.getElementById('nav-profile').onclick = ()=> renderProfile(user);
  document.getElementById('nav-logout').onclick = ()=>{
    currentUserId = null; save('nt_current', null); renderAuth(true);
  };
}

/* ---------- Diet Plan Generator ---------- */
function renderDietGenerator(user){
  const panel = document.getElementById('panel-area');
  if(!panel) return;
  // simple calorie split & sample meals
  const bmr = calcBMR(user.weight, user.height, user.age, user.gender);
  const tdee = Math.round(calcTDEE(bmr, user.activity || 1.2));
  const target = user.goal === 'lose' ? tdee-300 : user.goal === 'gain' ? tdee+300 : tdee;

  panel.innerHTML = `
    <div class="card">
      <h3>Diet Plan Generator</h3>
      <div class="small-muted">Target: ${target} kcal/day</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <select id="disease">
          <option value="">No disease-specific rule</option>
          <option value="diabetes">Diabetes</option>
          <option value="hypertension">Hypertension</option>
          <option value="heart">Heart disease</option>
        </select>
        <button id="generateNow">Generate</button>
        <button id="downloadPlan">Download (txt)</button>
      </div>
      <div id="dietResult" style="margin-top:12px"></div>
    </div>
  `;

  document.getElementById('generateNow').onclick = ()=>{
    const disease = document.getElementById('disease').value;
    const plan = buildSimplePlan(target, disease);
    const el = document.getElementById('dietResult');
    el.innerHTML = `
      <h4>Daily Plan</h4>
      <div><b>Breakfast</b>: ${plan.breakfast} (${plan.cals.breakfast} kcal)</div>
      <div><b>Snack</b>: ${plan.snack} (${plan.cals.snack} kcal)</div>
      <div><b>Lunch</b>: ${plan.lunch} (${plan.cals.lunch} kcal)</div>
      <div><b>Snack2</b>: ${plan.snack2} (${plan.cals.snack2} kcal)</div>
      <div><b>Dinner</b>: ${plan.dinner} (${plan.cals.dinner} kcal)</div>
    `;
    // attach download content
    document.getElementById('downloadPlan').onclick = ()=>{
      const txt = `NutriTrack - Daily plan\nTarget: ${target} kcal\n\nBreakfast: ${plan.breakfast} - ${plan.cals.breakfast} kcal\nSnack: ${plan.snack} - ${plan.cals.snack} kcal\nLunch: ${plan.lunch} - ${plan.cals.lunch} kcal\nSnack2: ${plan.snack2} - ${plan.cals.snack2} kcal\nDinner: ${plan.dinner} - ${plan.cals.dinner} kcal\n\n(Generated by NutriTrack)`;
      const blob = new Blob([txt], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'nutritrack_daily_plan.txt'; a.click();
      URL.revokeObjectURL(url);
    };
  };
}

// buildSimplePlan: splits calories to meals; applies simple disease rules
function buildSimplePlan(targetCals, disease){
  // distribution: 25% breakfast, 10% snack, 30% lunch, 10% snack2, 25% dinner
  const b = Math.round(targetCals * 0.25);
  const s = Math.round(targetCals * 0.10);
  const l = Math.round(targetCals * 0.30);
  const s2 = Math.round(targetCals * 0.10);
  const d = Math.round(targetCals * 0.25);

  // sample menu items (can expand)
  let breakfast = 'Oats with milk, berries, and nuts';
  let snack = 'Greek yogurt + fruit';
  let lunch = 'Grilled chicken, brown rice, mixed veggies';
  let snack2 = 'Carrot sticks and hummus';
  let dinner = 'Baked fish, quinoa, steamed greens';

  // disease-based adjustments (very simplified)
  if(disease === 'diabetes'){
    breakfast = 'Oats (no sugar), boiled egg';
    snack = 'Apple slices (small)';
    lunch = 'Grilled chicken, salad, legumes';
    snack2 = 'Cucumber slices';
    dinner = 'Steamed fish and veggies (low-carb)';
  } else if(disease === 'hypertension'){
    breakfast = 'Oatmeal, low-sodium nuts';
    snack = 'Banana';
    lunch = 'Grilled fish, brown rice, leafy greens (low-salt)';
    snack2 = 'Unsalted almonds';
    dinner = 'Vegetable soup, whole grain bread (low-sodium)';
  } else if(disease === 'heart'){
    breakfast = 'Oats, berries, flaxseed';
    snack = 'Orange (small)';
    lunch = 'Salmon salad, quinoa';
    snack2 = 'Walnuts (small)';
    dinner = 'Grilled vegetables, legumes';
  }

  return {
    breakfast, snack, lunch, snack2, dinner,
    cals: { breakfast:b, snack:s, lunch:l, snack2:s2, dinner:d }
  };
}

/* ---------- Food DB ---------- */
function renderFoodDB(){
  const html = `
    ${navBar()}
    <div class="card">
      <h3>Food & Nutrient Database</h3>
      <div class="search-row" style="margin-top:8px">
        <input id="food-q" placeholder="Search food or category (e.g., apple, fruits)" style="flex:1;padding:10px;border-radius:8px;border:1px solid #e6eef0">
        <select id="catFilter">
          <option value="">All categories</option>
          <option value="Fruits">Fruits</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Grains">Grains</option>
          <option value="Dairy">Dairy</option>
          <option value="Proteins">Proteins</option>
        </select>
        <button id="searchFood">Search</button>
      </div>
      <div id="foodList" class="list"></div>
    </div>
  `;
  mount(html);
  document.getElementById('searchFood').onclick = queryFood;
  document.getElementById('nav-logout').onclick = ()=>{ currentUserId=null; save('nt_current', null); renderAuth(true) };
  document.getElementById('nav-dashboard').onclick = renderDashboard;
  document.getElementById('nav-food').onclick = renderFoodDB;
  queryFood();
}
function queryFood(){
  const q = (document.getElementById('food-q').value || '').toLowerCase();
  const cat = document.getElementById('catFilter').value;
  const results = FOOD_DB.filter(f=>{
    return (!cat || f.category === cat) && (!q || f.name.toLowerCase().includes(q) || f.vitamins?.toLowerCase().includes(q));
  });
  const list = document.getElementById('foodList');
  list.innerHTML = results.map(f => `
    <div class="food-item card">
      <div style="flex:1">
        <div style="font-weight:700">${f.name}</div>
        <div class="small-muted">${f.category} • ${f.vitamins || ''}</div>
      </div>
      <div style="text-align:right" class="small-muted">
        ${f.calories} kcal<br/>
        P:${f.protein}g C:${f.carbs}g F:${f.fat}g
      </div>
    </div>
  `).join('') || '<div class="small-muted">No results</div>';
}

/* ---------- Exercises ---------- */
function renderExercises(){
  const html = `
    ${navBar()}
    <div class="card">
      <h3>Exercise Recommendations</h3>
      <div class="list">
        ${EXERCISES.map(e=>`
          <div class="exercise-item card">
            <img src="${e.img}" alt="${e.name}" style="width:84px;height:56px;border-radius:8px;object-fit:cover" />
            <div style="flex:1">
              <div style="font-weight:700">${e.name}</div>
              <div class="small-muted">${e.desc}</div>
            </div>
            <div class="small-muted" style="text-align:right">
              ${e.calories_per_30min ? e.calories_per_30min + ' kcal/30m' : (e.calories_per_15min ? e.calories_per_15min + ' kcal/15m' : '')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  mount(html);
  document.getElementById('nav-dashboard').onclick = renderDashboard;
  document.getElementById('nav-logout').onclick = ()=>{ currentUserId=null; save('nt_current', null); renderAuth(true) };
}

/* ---------- Health Info ---------- */
function renderHealthInfo(){
  const html = `
    ${navBar()}
    <div class="card">
      <h3>Health & Wellness</h3>
      <p class="small-muted">General tips, disease-based diet do's and don'ts:</p>
      <ul>
        <li><b>Diabetes:</b> Prefer low-GI carbs, spread carbs across the day, avoid added sugar.</li>
        <li><b>Hypertension:</b> Reduce sodium, prefer whole foods, eat potassium-rich fruits and vegetables.</li>
        <li><b>Heart:</b> Favor omega-3 rich fish, whole grains, limit saturated fats and processed foods.</li>
      </ul>
      <p class="small-muted">Remember to consult a registered dietitian or clinician for tailored medical advice.</p>
    </div>
  `;
  mount(html);
  document.getElementById('nav-dashboard').onclick = renderDashboard;
  document.getElementById('nav-logout').onclick = ()=>{ currentUserId=null; save('nt_current', null); renderAuth(true) };
}

/* ---------- Profile ---------- */
function renderProfile(user){
  const html = `
    ${navBar()}
    <div class="card">
      <h3>My Profile</h3>
      <div><b>Name:</b> ${user.name}</div>
      <div><b>Email:</b> ${user.email}</div>
      <div><b>Age:</b> ${user.age}</div>
      <div><b>Weight:</b> ${user.weight} kg</div>
      <div><b>Height:</b> ${user.height} cm</div>

      <div style="margin-top:12px">
        <label class="small-muted">Goal</label>
        <select id="profile-goal">
          <option value="lose" ${user.goal==='lose' ? 'selected' : ''}>Lose weight</option>
          <option value="maintenance" ${user.goal==='maintenance' ? 'selected' : ''}>Maintenance</option>
          <option value="gain" ${user.goal==='gain' ? 'selected' : ''}>Gain weight</option>
        </select>
        <label class="small-muted">Activity</label>
        <select id="profile-act">
          <option value="1.2" ${user.activity==1.2 ? 'selected':''}>Sedentary</option>
          <option value="1.375" ${user.activity==1.375 ? 'selected':''}>Light</option>
          <option value="1.55" ${user.activity==1.55 ? 'selected':''}>Moderate</option>
          <option value="1.725" ${user.activity==1.725 ? 'selected':''}>Active</option>
        </select>
        <div style="margin-top:10px">
          <button id="saveProfile">Save</button>
        </div>
      </div>
    </div>
  `;
  mount(html);
  document.getElementById('saveProfile').onclick = ()=>{
    const u = users.find(x=>x.id===user.id);
    u.goal = document.getElementById('profile-goal').value;
    u.activity = Number(document.getElementById('profile-act').value);
    save('nt_users', users);
    alert('Saved');
    renderDashboard();
  };
  document.getElementById('nav-logout').onclick = ()=>{ currentUserId=null; save('nt_current', null); renderAuth(true) };
}
/* ---- DARK MODE ---- */
document.addEventListener("click", (e) => {
  if (e.target.id === "themeToggle") {
    document.body.classList.toggle("dark");
    localStorage.setItem("nt_theme", document.body.classList.contains("dark") ? "dark" : "light");
  }
});

if (localStorage.getItem("nt_theme") === "dark") {
  document.body.classList.add("dark");
}


/* ---------- Boot / test user ---------- */
if(users.length === 0){
  // create a demo/test user
  users.push({
    id: uid(),
    name: 'Test User',
    email: 'test@demo',
    password: 'test123',
    age: 29,
    weight: 72,
    height: 174,
    gender: 'male',
    activity: 1.375,
    goal: 'maintenance'
  });
  save('nt_users', users);
}
if(currentUserId){
  // ensure user exists
  if(!users.find(u=>u.id===currentUserId)) currentUserId = null;
  save('nt_current', currentUserId);
}

/* ---------- Start app ---------- */
if(currentUserId) renderDashboard();
else renderAuth(true);
