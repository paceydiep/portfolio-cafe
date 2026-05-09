const fs = require('fs');

let content = fs.readFileSync('app/components/Scene3D.tsx', 'utf-8');

// 1. Import and extend RoundedBoxGeometry
if (!content.includes('RoundedBoxGeometry')) {
  const importStr = `import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';\nimport { extend } from '@react-three/fiber';\nextend({ RoundedBoxGeometry });\n`;
  content = content.replace('import * as THREE from "three";', importStr + 'import * as THREE from "three";');
}

// 2. Replace <boxGeometry args={[x, y, z]} />
content = content.replace(/<boxGeometry args={\[([^,]+),\s*([^,]+),\s*([^\]]+)\]}\s*\/>/g, (match, w, h, d) => {
  let wf = parseFloat(w);
  let hf = parseFloat(h);
  let df = parseFloat(d);
  if (!isNaN(wf) && !isNaN(hf) && !isNaN(df)) {
    let minDim = Math.min(wf, hf, df);
    let radius = Math.min(0.008, minDim * 0.45);
    return `<roundedBoxGeometry args={[${w}, ${h}, ${d}, 4, ${radius.toFixed(4)}]} />`;
  }
  return `<roundedBoxGeometry args={[${w}, ${h}, ${d}, 4, 0.005]} />`;
});

// For args={l.size}
content = content.replace(/<boxGeometry args=\{l\.size\}\s*\/>/g, `<roundedBoxGeometry args={[l.size[0], l.size[1], l.size[2], 4, Math.min(...l.size) * 0.45]} />`);

// For variable based args
content = content.replace(/<boxGeometry args={\[width \+ frameThick \* 2, frameThick, frameDepth\]}\s*\/>/g, `<roundedBoxGeometry args={[width + frameThick * 2, frameThick, frameDepth, 4, 0.002]} />`);
content = content.replace(/<boxGeometry args={\[frameThick, height, frameDepth\]}\s*\/>/g, `<roundedBoxGeometry args={[frameThick, height, frameDepth, 4, 0.002]} />`);
content = content.replace(/<boxGeometry args={\[0.06, height, 0.08\]}\s*\/>/g, `<roundedBoxGeometry args={[0.06, height, 0.08, 4, 0.005]} />`);
content = content.replace(/<boxGeometry args={\[width, 0.06, 0.08\]}\s*\/>/g, `<roundedBoxGeometry args={[width, 0.06, 0.08, 4, 0.005]} />`);

fs.writeFileSync('app/components/Scene3D.tsx', content);
console.log("Done");
