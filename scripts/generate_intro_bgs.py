import subprocess
import math

def generate_svg(width, height, is_dark=True):
    # Determine aspect
    is_tall = height > width
    
    # Palette
    if is_dark:
        bg_top = "#05060A"
        bg_mid = "#0B0E1B"
        bg_bottom = "#040508"
        arch_shadow = "#020306"
        gold_highlight = "#FFF3B3"
        gold_bright = "#F5D77A"
        gold_mid = "#D4AF37"
        gold_dark = "#8F6B18"
        gold_deep = "#523B06"
        mesh_bg = "#18140B"
        mesh_glow = "#FFAA1D"
        floor_specular = "rgba(100, 150, 220, 0.16)"
        floor_base = "#0A0D18"
        spotlight_beam = "rgba(255, 235, 175, 0.22)"
        vignette_color = "rgba(0, 0, 0, 0.75)"
    else:
        bg_top = "#FAF5EA"
        bg_mid = "#F3EBD8"
        bg_bottom = "#E9DEC6"
        arch_shadow = "#D8CCB0"
        gold_highlight = "#FFF6CF"
        gold_bright = "#E5B948"
        gold_mid = "#B8860B"
        gold_dark = "#7E5B05"
        gold_deep = "#4A3502"
        mesh_bg = "#FFF9EC"
        mesh_glow = "#E5A118"
        floor_specular = "rgba(255, 255, 255, 0.35)"
        floor_base = "#EFE5CE"
        spotlight_beam = "rgba(255, 235, 175, 0.18)"
        vignette_color = "rgba(120, 95, 45, 0.3)"

    cx = width / 2.0
    cy = height / 2.0
    
    # Floor placement
    if is_tall:
        floor_y = height * 0.62
        frieze_y = height * 0.28
        arch_span = width * 0.45
    else:
        floor_y = height * 0.68
        frieze_y = height * 0.24
        arch_span = width * 0.38

    # Particle points (deterministic)
    particles = []
    for i in range(45):
        px = cx + (math.sin(i * 3.7) * (width * 0.35))
        py = (height * 0.1) + ((i * 19.3) % (height * 0.65))
        r = 1.5 + (math.sin(i * 2.1) + 1) * 2.2
        op = 0.25 + (math.cos(i * 4.3) + 1) * 0.35
        particles.append((px, py, r, op))

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <!-- Master Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{bg_top}" />
      <stop offset="55%" stop-color="{bg_mid}" />
      <stop offset="100%" stop-color="{bg_bottom}" />
    </linearGradient>

    <linearGradient id="goldMolding" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{gold_dark}" />
      <stop offset="20%" stop-color="{gold_mid}" />
      <stop offset="45%" stop-color="{gold_highlight}" />
      <stop offset="65%" stop-color="{gold_bright}" />
      <stop offset="85%" stop-color="{gold_mid}" />
      <stop offset="100%" stop-color="{gold_dark}" />
    </linearGradient>

    <linearGradient id="goldVert" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{gold_bright}" />
      <stop offset="30%" stop-color="{gold_highlight}" />
      <stop offset="60%" stop-color="{gold_mid}" />
      <stop offset="100%" stop-color="{gold_dark}" />
    </linearGradient>

    <radialGradient id="spotCone" cx="50%" cy="0%" r="90%" fx="50%" fy="0%">
      <stop offset="0%" stop-color="{spotlight_beam}" />
      <stop offset="35%" stop-color="{spotlight_beam}" stop-opacity="0.6" />
      <stop offset="70%" stop-color="{spotlight_beam}" stop-opacity="0.1" />
      <stop offset="100%" stop-color="{spotlight_beam}" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="floorReflection" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="{floor_specular}" />
      <stop offset="40%" stop-color="{floor_specular}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="{floor_specular}" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
      <stop offset="40%" stop-color="transparent" />
      <stop offset="80%" stop-color="{vignette_color}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="{vignette_color}" stop-opacity="0.85" />
    </radialGradient>

    <!-- Mashrabiya Star Lattice Pattern -->
    <pattern id="mashrabiyaStar" width="48" height="48" patternUnits="userSpaceOnUse">
      <rect width="48" height="48" fill="{mesh_bg}" fill-opacity="0.3" />
      <g stroke="{gold_mid}" stroke-width="1.2" fill="none">
        <!-- 8-point star -->
        <polygon points="24,6 29,18 42,18 32,26 36,38 24,31 12,38 16,26 6,18 19,18" stroke="{gold_bright}" stroke-width="1.4" fill="{gold_mid}" fill-opacity="0.12" />
        <rect x="14" y="14" width="20" height="20" transform="rotate(45 24 24)" stroke="{gold_dark}" />
        <circle cx="24" cy="24" r="6" stroke="{gold_highlight}" stroke-width="0.8" />
        <circle cx="0" cy="0" r="10" />
        <circle cx="48" cy="0" r="10" />
        <circle cx="0" cy="48" r="10" />
        <circle cx="48" cy="48" r="10" />
      </g>
    </pattern>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="bokehBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" />
    </filter>
  </defs>

  <!-- 1. Background Base -->
  <rect width="{width}" height="{height}" fill="url(#bgGrad)" />

  <!-- 2. Distant Deep Wall Recesses -->
  <rect x="0" y="0" width="{width}" height="{floor_y + 40}" fill="{arch_shadow}" opacity="0.4" />

  <!-- 3. Spotlight Beams from Overhead -->
  <g opacity="0.85">
    <polygon points="{cx - 40},0 {cx + 40},0 {cx + arch_span * 1.3},{floor_y + 80} {cx - arch_span * 1.3},{floor_y + 80}" fill="url(#spotCone)" />
    <!-- Secondary subtle criss-cross rays -->
    <polygon points="{cx - 80},0 {cx - 20},0 {cx + arch_span * 0.9},{floor_y + 60} {cx + arch_span * 0.3},{floor_y + 60}" fill="url(#spotCone)" opacity="0.4" />
    <polygon points="{cx + 20},0 {cx + 80},0 {cx - arch_span * 0.3},{floor_y + 60} {cx - arch_span * 0.9},{floor_y + 60}" fill="url(#spotCone)" opacity="0.4" />
  </g>

  <!-- 4. Left & Right Architectural Arched Columns with Mashrabiya Backlit Screens -->
  <!-- Left Side Screens -->
  <g>
    <!-- Outer Arch Wall -->
    <path d="M 0,0 L {width * 0.16},0 L {width * 0.16},{floor_y} Q {width * 0.08},{floor_y * 0.9} 0,{floor_y * 0.8} Z" fill="{arch_shadow}" opacity="0.7" />
    
    <!-- Left Arched Lattice Window -->
    <rect x="{width * 0.03}" y="{frieze_y * 0.7}" width="{width * 0.1}" height="{floor_y - (frieze_y * 0.7)}" rx="{width * 0.05}" fill="url(#mashrabiyaStar)" stroke="url(#goldVert)" stroke-width="3" />
    
    <!-- Left Illuminated Standing Pylon -->
    <rect x="{cx - arch_span * 0.9}" y="{frieze_y * 1.05}" width="{width * 0.12 if is_tall else width * 0.07}" height="{floor_y - (frieze_y * 1.05)}" fill="url(#mashrabiyaStar)" stroke="url(#goldMolding)" stroke-width="3" filter="url(#softGlow)" opacity="0.9" />
  </g>

  <!-- Right Side Screens -->
  <g>
    <!-- Outer Arch Wall -->
    <path d="M {width},0 L {width * 0.84},0 L {width * 0.84},{floor_y} Q {width * 0.92},{floor_y * 0.9} {width},{floor_y * 0.8} Z" fill="{arch_shadow}" opacity="0.7" />
    
    <!-- Right Arched Lattice Window -->
    <rect x="{width * 0.87}" y="{frieze_y * 0.7}" width="{width * 0.1}" height="{floor_y - (frieze_y * 0.7)}" rx="{width * 0.05}" fill="url(#mashrabiyaStar)" stroke="url(#goldVert)" stroke-width="3" />

    <!-- Right Illuminated Standing Pylon -->
    <rect x="{cx + arch_span * 0.9 - (width * 0.12 if is_tall else width * 0.07)}" y="{frieze_y * 1.05}" width="{width * 0.12 if is_tall else width * 0.07}" height="{floor_y - (frieze_y * 1.05)}" fill="url(#mashrabiyaStar)" stroke="url(#goldMolding)" stroke-width="3" filter="url(#softGlow)" opacity="0.9" />
  </g>

  <!-- 5. Overhead Curved Golden Frieze / Balcony Ring with Mashrabiya Band -->
  <g>
    <!-- Arch Curved Band -->
    <path d="M {width * 0.05},{frieze_y + 40} Q {cx},{frieze_y - 20} {width * 0.95},{frieze_y + 40} L {width * 0.95},{frieze_y + 90} Q {cx},{frieze_y + 30} {width * 0.05},{frieze_y + 90} Z" fill="url(#mashrabiyaStar)" stroke="url(#goldMolding)" stroke-width="2.5" />
    
    <!-- Upper Glowing Trim Ribbon -->
    <path d="M {width * 0.02},{frieze_y + 38} Q {cx},{frieze_y - 22} {width * 0.98},{frieze_y + 38}" fill="none" stroke="url(#goldMolding)" stroke-width="6" stroke-linecap="round" />
    <path d="M {width * 0.02},{frieze_y + 34} Q {cx},{frieze_y - 26} {width * 0.98},{frieze_y + 34}" fill="none" stroke="{gold_highlight}" stroke-width="2" opacity="0.8" />
    
    <!-- Lower Glowing Trim Ribbon -->
    <path d="M {width * 0.02},{frieze_y + 92} Q {cx},{frieze_y + 32} {width * 0.98},{frieze_y + 92}" fill="none" stroke="url(#goldMolding)" stroke-width="5" stroke-linecap="round" />
    <path d="M {width * 0.02},{frieze_y + 95} Q {cx},{frieze_y + 35} {width * 0.98},{frieze_y + 95}" fill="none" stroke="{gold_dark}" stroke-width="2" />
  </g>

  <!-- 6. Stepped Stage Platform & High-Gloss Reflective Dais Floor -->
  <g>
    <!-- Lower Step Tier -->
    <ellipse cx="{cx}" cy="{floor_y + (260 if is_tall else 180)}" rx="{width * 0.62}" ry="{190 if is_tall else 120}" fill="{arch_shadow}" stroke="{gold_dark}" stroke-width="2" />
    <path d="M {cx - width * 0.62},{floor_y + (260 if is_tall else 180)} Q {cx},{floor_y + (360 if is_tall else 250)} {cx + width * 0.62},{floor_y + (260 if is_tall else 180)}" fill="none" stroke="url(#goldMolding)" stroke-width="4" />

    <!-- Middle Step Tier -->
    <ellipse cx="{cx}" cy="{floor_y + (180 if is_tall else 120)}" rx="{width * 0.55}" ry="{170 if is_tall else 105}" fill="{floor_base}" />
    <path d="M {cx - width * 0.55},{floor_y + (180 if is_tall else 120)} Q {cx},{floor_y + (280 if is_tall else 190)} {cx + width * 0.55},{floor_y + (180 if is_tall else 120)}" fill="none" stroke="url(#goldMolding)" stroke-width="4.5" />

    <!-- Main Stage Dais Surface -->
    <ellipse cx="{cx}" cy="{floor_y + (90 if is_tall else 60)}" rx="{width * 0.48}" ry="{150 if is_tall else 90}" fill="{floor_base}" stroke="url(#goldMolding)" stroke-width="4" />
    
    <!-- Central Stage Spotlight Reflection Pool -->
    <ellipse cx="{cx}" cy="{floor_y + (90 if is_tall else 60)}" rx="{width * 0.32}" ry="{80 if is_tall else 50}" fill="url(#floorReflection)" />
    <ellipse cx="{cx}" cy="{floor_y + (90 if is_tall else 60)}" rx="{width * 0.16}" ry="{35 if is_tall else 22}" fill="{gold_highlight}" opacity="{0.35 if is_dark else 0.45}" filter="url(#bokehBlur)" />
  </g>

  <!-- 7. Floating Golden Dust Bokeh / Sparkles -->
  <g filter="url(#bokehBlur)">
    {' '.join(f'<circle cx="{px}" cy="{py}" r="{r}" fill="{gold_bright}" opacity="{op}" />' for px, py, r, op in particles)}
    <!-- Accent Star Twinkles -->
    <g transform="translate({cx - 30}, {height * 0.22}) scale(0.8)">
      <path d="M 0,-15 Q 0,0 15,0 Q 0,0 0,15 Q 0,0 -15,0 Q 0,0 0,-15" fill="{gold_highlight}" filter="url(#softGlow)" />
    </g>
    <g transform="translate({cx + arch_span * 0.4}, {height * 0.35}) scale(0.6)">
      <path d="M 0,-15 Q 0,0 15,0 Q 0,0 0,15 Q 0,0 -15,0 Q 0,0 0,-15" fill="{gold_highlight}" filter="url(#softGlow)" />
    </g>
    <g transform="translate({cx - arch_span * 0.5}, {height * 0.42}) scale(0.65)">
      <path d="M 0,-15 Q 0,0 15,0 Q 0,0 0,15 Q 0,0 -15,0 Q 0,0 0,-15" fill="{gold_highlight}" filter="url(#softGlow)" />
    </g>
  </g>

  <!-- 8. Grand Framing Border & Islamic Corner Arabesques -->
  <g stroke="url(#goldMolding)">
    <!-- Outer perimeter thin frame -->
    <rect x="14" y="14" width="{width - 28}" height="{height - 28}" rx="8" fill="none" stroke-width="2.5" />
    <rect x="22" y="22" width="{width - 44}" height="{height - 44}" rx="6" fill="none" stroke-width="1.2" opacity="0.75" />

    <!-- Corner Filigree Flourishes -->
    <!-- Top-Left -->
    <path d="M 22,70 C 22,40 40,22 70,22 C 55,35 35,55 22,70 Z" fill="{gold_mid}" fill-opacity="0.35" stroke-width="1.8" />
    <path d="M 22,22 L 50,22 Q 35,35 22,50 Z" fill="{gold_bright}" stroke-width="1.5" />
    
    <!-- Top-Right -->
    <path d="M {width - 22},70 C {width - 22},40 {width - 40},22 {width - 70},22 C {width - 55},35 {width - 35},55 {width - 22},70 Z" fill="{gold_mid}" fill-opacity="0.35" stroke-width="1.8" />
    <path d="M {width - 22},22 L {width - 50},22 Q {width - 35},35 {width - 22},50 Z" fill="{gold_bright}" stroke-width="1.5" />

    <!-- Bottom-Left -->
    <path d="M 22,{height - 70} C 22,{height - 40} 40,{height - 22} 70,{height - 22} C 55,{height - 35} 35,{height - 55} 22,{height - 70} Z" fill="{gold_mid}" fill-opacity="0.35" stroke-width="1.8" />
    <path d="M 22,{height - 22} L 50,{height - 22} Q 35,{height - 35} 22,{height - 50} Z" fill="{gold_bright}" stroke-width="1.5" />

    <!-- Bottom-Right -->
    <path d="M {width - 22},{height - 70} C {width - 22},{height - 40} {width - 40},{height - 22} {width - 70},{height - 22} C {width - 55},{height - 35} {width - 35},{height - 55} {width - 22},{height - 70} Z" fill="{gold_mid}" fill-opacity="0.35" stroke-width="1.8" />
    <path d="M {width - 22},{height - 22} L {width - 50},{height - 22} Q {width - 35},{height - 35} {width - 22},{height - 50} Z" fill="{gold_bright}" stroke-width="1.5" />
  </g>

  <!-- 9. Final Edge Vignette -->
  <rect width="{width}" height="{height}" fill="url(#vignette)" pointer-events="none" />
</svg>"""
    return svg

targets = [
    ("bg-intro-dark-wide", 1920, 1080, True),
    ("bg-intro-dark-tall", 1080, 1920, True),
    ("bg-intro-light-wide", 1920, 1080, False),
    ("bg-intro-light-tall", 1080, 1920, False),
]

for name, w, h, dark in targets:
    svg_content = generate_svg(w, h, dark)
    svg_path = f"/tmp/{name}.svg"
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    
    # Render to WebP for public/assets and assets/
    for out_dir in ["public/assets", "assets"]:
        webp_path = f"{out_dir}/{name}.webp"
        cmd = ["ffmpeg", "-y", "-i", svg_path, "-vframes", "1", webp_path]
        print(f"Generating {webp_path}...")
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error for {webp_path}: {res.stderr}")
        else:
            print(f"Created {webp_path} successfully.")

print("All WebP images generated.")
