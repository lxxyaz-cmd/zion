<template>
  <div class="root">
    <!-- Scene nav bar -->
    <nav class="scene-nav">
      <RouterLink to="/"         class="nav-btn" active-class="active">冷却系统</RouterLink>
      <RouterLink to="/conveyor" class="nav-btn" active-class="active">工业传送带</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style>
:root {
  --bg:#0d1117; --card:#161b22; --card2:#1c2128; --border:#30363d;
  --text:#c9d1d9; --dim:#484f58; --blue:#58a6ff; --green:#3fb950;
  --greenglow:#3fb95099; --red:#f85149; --orange:#d29922; --water:#4fc3f7;
}
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:var(--bg); color:var(--text); font-family:"Segoe UI","Microsoft YaHei",monospace; font-size:13px; }
a { text-decoration:none; }
</style>

<style scoped>
.root { display:flex; flex-direction:column; height:100vh; overflow:hidden; }

.scene-nav {
  display:flex; gap:4px; padding:4px 12px;
  background:#0c1018; border-bottom:1px solid #1e2530; flex-shrink:0; z-index:10;
}
.nav-btn {
  padding:4px 14px; border-radius:4px; font-size:12px; color:#7090a8;
  border:1px solid transparent; transition:all .15s; cursor:pointer;
}
.nav-btn:hover { color:#a0c0d8; border-color:#2a3a4a; }
.nav-btn.active { color:#7ec8f8; border-color:#3a5a7a; background:#0e1e30; font-weight:600; }
</style>
