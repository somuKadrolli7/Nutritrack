// js/app.js
const root = document.getElementById('root');

/* ---------- Utilities ---------- */
const uid = () => Math.random().toString(36).slice(2,9);
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const load = k => JSON.parse(localStorage.getItem(k) || 'null');

/* ---------- Data stores ---------- */
let users = load('nt_users') || [];
let currentUserId = load('nt_current') || null;

const FOOD_DB = [
  { id: uid(), name: 'Apple', category: 'Fruits', calories: 52, carbs: 14, protein: 0.3, fat: 0.2, vitamins: 'C, K' },
  { id: uid(), name: 'Banana', category: 'Fruits', calories: 96, carbs: 27, protein: 1.3, fat: 0.3, vitamins: 'B6, C' },
  { id: uid(), name: 'Broccoli', category: 'Vegetables', calories: 34, carbs: 7, protein: 2.8, fat: 0.4, vitamins: 'C, K' },
  { id: uid(), name: 'Chicken Breast (100g)', category: 'Proteins', calories: 165, carbs: 0, protein: 31, fat: 3.6, vitamins: 'B3, B6' },
  { id: uid(), name: 'Brown Rice (100g)', category: 'Grains', calories: 123, carbs: 25.6, protein: 2.6, fat: 1, vitamins: 'B' },
  { id: uid(), name: 'Milk (200ml)', category: 'Dairy', calories: 122, carbs: 12, protein: 6.6, fat: 4.8, vitamins: 'A, D' }
];

const EXERCISES = [
  { id: uid(), name: 'Brisk Walking', calories_per_30min: 150, desc: 'Low impact cardio, great for beginners.', img: 'https://images.unsplash.com/photo-1554288249-ef5b40d5f2a3?auto=format&fit=crop&w=800&q=60' },
  { id: uid(), name: 'Jogging', calories_per_30min: 250, desc: 'Moderate intensity cardio for fat burn.', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=60' },
  { id: uid(), name: 'Push-ups', calories_per_15min: 100, desc: 'Bodyweight strength for chest and triceps.', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=60' }
];

/* ---------- Health math ---------- */
function calcBMI(w,h){ if(!w||!h) return null; return +(w/((h/100)**2)).toFixed(1); }
function bmiCategory(bmi){
  if(bmi===null) return {cat:'-',color:'#7a8aaa'};
  if(bmi<18.5) return {cat:'Underweight',color:'#f59e0b'};
  if(bmi<25)   return {cat:'Normal',color:'#06d6a0'};
  if(bmi<30)   return {cat:'Overweight',color:'#fb923c'};
  return {cat:'Obese',color:'#f72585'};
}
function calcBMR(w,h,age,g){ return g==='male' ? 88.36+(13.4*w)+(4.8*h)-(5.7*age) : 447.6+(9.2*w)+(3.1*h)-(4.3*age); }
function calcTDEE(bmr,af=1.2){ return bmr*af; }

/* ---------- Mount ---------- */
function mount(html){ root.innerHTML = `<div class="app fade">${html}</div>`; }

/* ---------- Navbar ---------- */
function navBar(){
  return `
  <nav class="nav">
    <div class="brand">⚡ NutriTrack</div>
    <div class="menu">
      <button id="themeToggle" title="Toggle theme">🌓</button>
      <button id="nav-dashboard">🏠 Dashboard</button>
      <button id="nav-food">🥗 Food</button>
      <button id="nav-ex">🏋️ Exercises</button>
      <button id="nav-health">❤️ Health</button>
      <button id="nav-profile">👤 Profile</button>
      <button id="nav-logout" class="btn-accent2">⏻ Logout</button>
    </div>
  </nav>`;
}

function attachNav(user){
  document.getElementById('nav-dashboard').onclick = renderDashboard;
  document.getElementById('nav-food').onclick = renderFoodDB;
  document.getElementById('nav-ex').onclick = renderExercises;
  document.getElementById('nav-health').onclick = renderHealthInfo;
  document.getElementById('nav-profile').onclick = ()=>renderProfile(user||currentUser());
  document.getElementById('nav-logout').onclick = ()=>{ currentUserId=null; save('nt_current',null); renderAuth(true); };
}
function currentUser(){ return users.find(u=>u.id===currentUserId); }

/* ---------- Auth ---------- */
function renderAuth(login=true){
  const bg = login
    ? 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80'
    : 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=80';

  mount(`
  <div class="auth-screen">
    <div class="auth-left" style="background-image:url('${bg}')">
      <div class="auth-logo">⚡ NutriTrack</div>
      <p>Your smart nutrition & fitness companion. Track meals, monitor health metrics, and hit your goals.</p>
    </div>
    <div class="auth-right">
      <div class="auth-box">
        ${login ? `
          <h2>Welcome back 👋</h2>
          <p class="sub">Sign in to your account</p>
          <form id="frmLogin">
            <div class="form-group"><label>Email</label><input id="liEmail" placeholder="you@example.com" type="email" required/></div>
            <div class="form-group"><label>Password</label><input id="liPass" placeholder="••••••••" type="password" required/></div>
            <button type="submit" class="submit-btn">Sign In →</button>
          </form>
          <div class="auth-switch">No account? <a id="toRegister" href="#">Create one</a></div>
        ` : `
          <h2>Create account 🚀</h2>
          <p class="sub">Start your health journey today</p>
          <form id="frmReg">
            <div class="form-group"><label>Full Name</label><input id="rName" placeholder="Alex Johnson" required/></div>
            <div class="form-group"><label>Email</label><input id="rEmail" placeholder="you@example.com" type="email" required/></div>
            <div class="form-group"><label>Password</label><input id="rPass" placeholder="••••••••" type="password" required/></div>
            <div class="form-group">
              <label>Age / Weight (kg) / Height (cm)</label>
              <div class="three-col">
                <input id="rAge" placeholder="Age" type="number" min="8"/>
                <input id="rWeight" placeholder="Weight" type="number"/>
                <input id="rHeight" placeholder="Height" type="number"/>
              </div>
            </div>
            <div class="form-group"><label>Gender</label>
              <select id="rGender" required>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <button type="submit" class="submit-btn">Create Account →</button>
          </form>
          <div class="auth-switch">Already have an account? <a id="toLogin" href="#">Sign in</a></div>
        `}
      </div>
    </div>
  </div>`);

  if(login){
    document.getElementById('frmLogin').onsubmit = e=>{
      e.preventDefault();
      const email = document.getElementById('liEmail').value.trim().toLowerCase();
      const pass  = document.getElementById('liPass').value;
      const u = users.find(x=>x.email===email && x.password===pass);
      if(u){ currentUserId=u.id; save('nt_current',currentUserId); renderDashboard(); }
      else  { alert('Invalid credentials. Demo: test@demo / test123'); }
    };
    document.getElementById('toRegister').onclick = e=>{ e.preventDefault(); renderAuth(false); };
  } else {
    document.getElementById('frmReg').onsubmit = e=>{
      e.preventDefault();
      const newU = {
        id:uid(), name:document.getElementById('rName').value.trim(),
        email:document.getElementById('rEmail').value.trim().toLowerCase(),
        password:document.getElementById('rPass').value,
        age:Number(document.getElementById('rAge').value||0),
        weight:Number(document.getElementById('rWeight').value||0),
        height:Number(document.getElementById('rHeight').value||0),
        gender:document.getElementById('rGender').value,
        activity:1.2, goal:'maintenance'
      };
      if(users.some(x=>x.email===newU.email)){ alert('Email already used'); return; }
      users.push(newU); save('nt_users',users);
      alert('Registered! Now sign in.');
      renderAuth(true);
    };
    document.getElementById('toLogin').onclick = e=>{ e.preventDefault(); renderAuth(true); };
  }
}

/* ---------- Dashboard ---------- */
function renderDashboard(){
  const user = currentUser();
  if(!user){ renderAuth(true); return; }

  const bmi  = calcBMI(user.weight, user.height);
  const cat  = bmiCategory(bmi);
  const bmr  = calcBMR(user.weight, user.height, user.age, user.gender);
  const tdee = calcTDEE(bmr, user.activity||1.2);
  const rec  = Math.round(tdee + (user.goal==='lose'?-300:user.goal==='gain'?300:0));
  const init = user.name.charAt(0).toUpperCase();

  mount(`
  ${navBar()}
  <div class="layout">
    <div class="sidebar card">
      <div class="user-avatar">${init}</div>
      <div class="user-name">${user.name}</div>
      <div class="user-email">${user.email}</div>
      <div class="side-divider"></div>
      <div class="side-item active" id="menu-dashboard"><span class="icon">🏠</span> Overview</div>
      <div class="side-item" id="menu-diet"><span class="icon">🍽️</span> Diet Planner</div>
      <div class="side-item" id="menu-food"><span class="icon">🥗</span> Food Database</div>
      <div class="side-item" id="menu-ex"><span class="icon">🏋️</span> Exercises</div>
      <div class="side-item" id="menu-health"><span class="icon">❤️</span> Health Info</div>
      <div class="side-divider"></div>
      <div class="side-item" id="menu-profile"><span class="icon">👤</span> Profile</div>
    </div>

    <div style="flex:1;min-width:0">
      <div class="card header-row">
        <div>
          <h2>Welcome back, ${user.name.split(' ')[0]} 👋</h2>
          <div class="small-muted mt-8">Track your progress and get a personalised plan</div>
        </div>
        <div class="daily-target-badge">
          <div class="lbl">Daily Target</div>
          <div class="val">${rec} kcal</div>
        </div>
      </div>

      <div class="grid-3">
        <div class="card card-small stat-card s1">
          <div class="stat-label">BMI</div>
          <div class="stat-value" style="color:${cat.color}">${bmi||'—'}</div>
          <div class="stat-sub">${cat.cat}</div>
        </div>
        <div class="card card-small stat-card s2">
          <div class="stat-label">BMR</div>
          <div class="stat-value">${Math.round(bmr)}</div>
          <div class="stat-sub">kcal / day (basal)</div>
        </div>
        <div class="card card-small stat-card s3">
          <div class="stat-label">TDEE</div>
          <div class="stat-value">${Math.round(tdee)}</div>
          <div class="stat-sub">kcal / day (active)</div>
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-top:14px;flex-wrap:wrap">
        <div class="card" style="flex:1;min-width:260px">
          <h3 style="font-family:'Outfit',sans-serif;font-weight:700">📈 Weekly Progress</h3>
          <div class="chart-wrap"><canvas id="chartWeek"></canvas></div>
        </div>
        <div class="card" style="width:280px;flex-shrink:0">
          <h3 style="font-family:'Outfit',sans-serif;font-weight:700">⚡ Quick Actions</h3>
          <div class="quick-actions">
            <button id="btn-generate">🍽️ Generate Diet Plan</button>
            <button id="btn-view-food">🥗 Food Database</button>
            <button id="btn-ex">🏋️ Exercise Suggestions</button>
          </div>
        </div>
      </div>

      <div id="panel-area" class="mt-12"></div>
    </div>
  </div>`);

  // Chart
  const ctx = document.getElementById('chartWeek').getContext('2d');
  new Chart(ctx,{
    type:'line',
    data:{
      labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[{
        label:'Calories',
        data:[rec-200,rec-50,rec+100,rec-300,rec,rec+50,rec-150],
        fill:true,
        tension:0.4,
        borderColor:'#6c63ff',
        backgroundColor:'rgba(108,99,255,0.12)',
        pointBackgroundColor:'#a78bfa',
        pointRadius:5,
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#7a8aaa'}},
        y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#7a8aaa'}}
      }
    }
  });

  document.getElementById('menu-dashboard').onclick = renderDashboard;
  document.getElementById('menu-diet').onclick  = ()=>renderDietGenerator(user);
  document.getElementById('menu-food').onclick  = renderFoodDB;
  document.getElementById('menu-ex').onclick    = renderExercises;
  document.getElementById('menu-health').onclick= renderHealthInfo;
  document.getElementById('menu-profile').onclick=()=>renderProfile(user);
  document.getElementById('btn-generate').onclick=()=>renderDietGenerator(user);
  document.getElementById('btn-view-food').onclick=renderFoodDB;
  document.getElementById('btn-ex').onclick     =renderExercises;
  attachNav(user);
}

/* ---------- Diet Generator ---------- */
function renderDietGenerator(user){
  const panel = document.getElementById('panel-area');
  if(!panel) return;
  const bmr = calcBMR(user.weight,user.height,user.age,user.gender);
  const tdee = Math.round(calcTDEE(bmr,user.activity||1.2));
  const target = user.goal==='lose'?tdee-300:user.goal==='gain'?tdee+300:tdee;

  panel.innerHTML=`
  <div class="card">
    <div class="section-title">🍽️ Diet Plan Generator</div>
    <div class="section-sub">Target: <b>${target} kcal/day</b> based on your goal</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <select id="disease" style="max-width:260px;margin-bottom:0">
        <option value="">No disease-specific rule</option>
        <option value="diabetes">Diabetes</option>
        <option value="hypertension">Hypertension</option>
        <option value="heart">Heart disease</option>
      </select>
      <button id="generateNow" style="margin-bottom:0">Generate Plan ✨</button>
      <button id="downloadPlan" class="btn-accent" style="margin-bottom:0">⬇ Download</button>
    </div>
    <div id="dietResult"></div>
  </div>`;

  document.getElementById('generateNow').onclick=()=>{
    const disease = document.getElementById('disease').value;
    const plan = buildSimplePlan(target,disease);
    document.getElementById('dietResult').innerHTML=`
    <div class="diet-result">
      ${[
        ['🌅 Breakfast',plan.breakfast,plan.cals.breakfast],
        ['🍎 Snack',plan.snack,plan.cals.snack],
        ['☀️ Lunch',plan.lunch,plan.cals.lunch],
        ['🫐 Snack 2',plan.snack2,plan.cals.snack2],
        ['🌙 Dinner',plan.dinner,plan.cals.dinner]
      ].map(([label,food,kcal],i)=>`
        <div class="meal-card" style="animation-delay:${i*0.07}s">
          <div class="meal-label">${label}</div>
          <div class="meal-food">${food}</div>
          <div class="meal-kcal">${kcal} kcal</div>
        </div>`).join('')}
    </div>`;
    document.getElementById('downloadPlan').onclick=()=>{
      const txt=`NutriTrack - Daily Plan\nTarget: ${target} kcal\n\nBreakfast: ${plan.breakfast} - ${plan.cals.breakfast} kcal\nSnack: ${plan.snack} - ${plan.cals.snack} kcal\nLunch: ${plan.lunch} - ${plan.cals.lunch} kcal\nSnack2: ${plan.snack2} - ${plan.cals.snack2} kcal\nDinner: ${plan.dinner} - ${plan.cals.dinner} kcal\n\n(Generated by NutriTrack)`;
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
      a.download='nutritrack_plan.txt'; a.click();
    };
  };
}

function buildSimplePlan(targetCals,disease){
  const b=Math.round(targetCals*0.25),s=Math.round(targetCals*0.10),
        l=Math.round(targetCals*0.30),s2=Math.round(targetCals*0.10),
        d=Math.round(targetCals*0.25);
  let breakfast='Oats with milk, berries, and nuts',snack='Greek yogurt + fruit',
      lunch='Grilled chicken, brown rice, mixed veggies',snack2='Carrot sticks and hummus',
      dinner='Baked fish, quinoa, steamed greens';
  if(disease==='diabetes'){
    breakfast='Oats (no sugar), boiled egg'; snack='Apple slices (small)';
    lunch='Grilled chicken, salad, legumes'; snack2='Cucumber slices';
    dinner='Steamed fish and veggies (low-carb)';
  } else if(disease==='hypertension'){
    breakfast='Oatmeal, low-sodium nuts'; snack='Banana';
    lunch='Grilled fish, brown rice, leafy greens (low-salt)'; snack2='Unsalted almonds';
    dinner='Vegetable soup, whole grain bread (low-sodium)';
  } else if(disease==='heart'){
    breakfast='Oats, berries, flaxseed'; snack='Orange (small)';
    lunch='Salmon salad, quinoa'; snack2='Walnuts (small)';
    dinner='Grilled vegetables, legumes';
  }
  return {breakfast,snack,lunch,snack2,dinner,cals:{breakfast:b,snack:s,lunch:l,snack2:s2,dinner:d}};
}

/* ---------- Food DB ---------- */
function renderFoodDB(){
  mount(`
  ${navBar()}
  <div class="card">
    <div class="section-title">🥗 Food & Nutrient Database</div>
    <div class="section-sub">Search and explore nutritional information</div>
    <div class="search-row">
      <input id="food-q" placeholder="🔍  Search food, e.g. apple, protein…"/>
      <select id="catFilter">
        <option value="">All Categories</option>
        <option value="Fruits">🍎 Fruits</option>
        <option value="Vegetables">🥦 Vegetables</option>
        <option value="Grains">🌾 Grains</option>
        <option value="Dairy">🥛 Dairy</option>
        <option value="Proteins">🍗 Proteins</option>
      </select>
      <button id="searchFood">Search</button>
    </div>
    <div id="foodList"></div>
  </div>`);
  attachNav();
  document.getElementById('searchFood').onclick=queryFood;
  document.getElementById('food-q').onkeyup=e=>{ if(e.key==='Enter') queryFood(); };
  queryFood();
}

function queryFood(){
  const q=(document.getElementById('food-q').value||'').toLowerCase();
  const cat=document.getElementById('catFilter').value;
  const results=FOOD_DB.filter(f=>(!cat||f.category===cat)&&(!q||f.name.toLowerCase().includes(q)||f.vitamins?.toLowerCase().includes(q)));
  document.getElementById('foodList').innerHTML=results.map((f,i)=>`
  <div class="food-item card" style="animation-delay:${i*0.05}s">
    <div>
      <div class="food-name">${f.name}</div>
      <div class="food-meta">${f.category} • Vitamins: ${f.vitamins||'—'}</div>
    </div>
    <div>
      <div class="food-cal">${f.calories} kcal</div>
      <div class="food-macro">P ${f.protein}g · C ${f.carbs}g · F ${f.fat}g</div>
    </div>
  </div>`).join('')||'<div class="small-muted mt-12">No results found.</div>';
}

/* ---------- Exercises ---------- */
function renderExercises(){
  mount(`
  ${navBar()}
  <div class="card">
    <div class="section-title">🏋️ Exercise Recommendations</div>
    <div class="section-sub">Burn calories and build strength</div>
    <div id="exList">
      ${EXERCISES.map((e,i)=>`
      <div class="exercise-item card" style="animation-delay:${i*0.08}s">
        <img src="${e.img}" alt="${e.name}" class="ex-img"/>
        <div class="ex-info">
          <div class="ex-name">${e.name}</div>
          <div class="ex-desc">${e.desc}</div>
        </div>
        <div class="ex-cal">${e.calories_per_30min?e.calories_per_30min+' kcal / 30 min':e.calories_per_15min+' kcal / 15 min'}</div>
      </div>`).join('')}
    </div>
  </div>`);
  attachNav();
}

/* ---------- Health Info ---------- */
function renderHealthInfo(){
  mount(`
  ${navBar()}
  <div class="card">
    <div class="section-title">❤️ Health & Wellness Guide</div>
    <div class="section-sub">Evidence-based tips for common health conditions</div>
    <div class="mt-12">
      <div class="health-tip t1">
        <div class="tip-icon">🩸</div>
        <div>
          <div class="tip-title">Diabetes</div>
          <div class="tip-body">Prefer low-GI carbs, spread carbs across the day, avoid added sugar. Include fibre-rich foods and monitor portion sizes carefully.</div>
        </div>
      </div>
      <div class="health-tip t2">
        <div class="tip-icon">💙</div>
        <div>
          <div class="tip-title">Hypertension</div>
          <div class="tip-body">Reduce sodium intake, prefer whole foods, and eat potassium-rich fruits and vegetables. Limit caffeine and processed foods.</div>
        </div>
      </div>
      <div class="health-tip t3">
        <div class="tip-icon">❤️</div>
        <div>
          <div class="tip-title">Heart Disease</div>
          <div class="tip-body">Favour omega-3 rich fish, whole grains, and limit saturated fats and processed foods. Stay active with light-to-moderate exercise.</div>
        </div>
      </div>
    </div>
    <p class="small-muted mt-16">⚠️ Always consult a registered dietitian or clinician for tailored medical advice.</p>
  </div>`);
  attachNav();
}

/* ---------- Profile ---------- */
function renderProfile(user){
  if(!user) user=currentUser();
  const init=user.name.charAt(0).toUpperCase();
  mount(`
  ${navBar()}
  <div class="card">
    <div class="profile-header">
      <div class="profile-avatar">${init}</div>
      <div>
        <div class="profile-name">${user.name}</div>
        <div class="profile-email">${user.email}</div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="pstat"><div class="num">${user.age||'—'}</div><div class="lbl">Age</div></div>
      <div class="pstat"><div class="num">${user.weight||'—'}</div><div class="lbl">Weight (kg)</div></div>
      <div class="pstat"><div class="num">${user.height||'—'}</div><div class="lbl">Height (cm)</div></div>
    </div>
    <hr/>
    <div class="section-title" style="font-size:17px;margin-bottom:12px">Settings</div>
    <div class="two-col">
      <div class="form-group">
        <label>Goal</label>
        <select id="profile-goal">
          <option value="lose" ${user.goal==='lose'?'selected':''}>🔻 Lose Weight</option>
          <option value="maintenance" ${user.goal==='maintenance'?'selected':''}>⚖️ Maintenance</option>
          <option value="gain" ${user.goal==='gain'?'selected':''}>📈 Gain Weight</option>
        </select>
      </div>
      <div class="form-group">
        <label>Activity Level</label>
        <select id="profile-act">
          <option value="1.2"   ${user.activity==1.2?'selected':''}>🛋️ Sedentary</option>
          <option value="1.375" ${user.activity==1.375?'selected':''}>🚶 Light</option>
          <option value="1.55"  ${user.activity==1.55?'selected':''}>🏃 Moderate</option>
          <option value="1.725" ${user.activity==1.725?'selected':''}>⚡ Active</option>
        </select>
      </div>
    </div>
    <button id="saveProfile">💾 Save Changes</button>
  </div>`);
  document.getElementById('saveProfile').onclick=()=>{
    const u=users.find(x=>x.id===user.id);
    u.goal=document.getElementById('profile-goal').value;
    u.activity=Number(document.getElementById('profile-act').value);
    save('nt_users',users); alert('✅ Saved!'); renderDashboard();
  };
  attachNav(user);
}

/* ---------- Theme Toggle ---------- */
document.addEventListener('click',e=>{
  if(e.target.id==='themeToggle'){
    document.body.classList.toggle('light');
    localStorage.setItem('nt_theme',document.body.classList.contains('light')?'light':'dark');
  }
});
if(localStorage.getItem('nt_theme')==='light') document.body.classList.add('light');

/* ---------- Boot ---------- */
if(users.length===0){
  users.push({ id:uid(), name:'Test User', email:'test@demo', password:'test123',
    age:29, weight:72, height:174, gender:'male', activity:1.375, goal:'maintenance' });
  save('nt_users',users);
}
if(currentUserId && !users.find(u=>u.id===currentUserId)){ currentUserId=null; save('nt_current',null); }

if(currentUserId) renderDashboard(); else renderAuth(true);
