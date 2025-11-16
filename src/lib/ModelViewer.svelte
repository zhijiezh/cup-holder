<script lang="ts">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
  import { onMount } from 'svelte';

  let container: HTMLElement;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // █   全局变量 & 状态管理
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls;

  const THEMES = {
    spongebob: {
      background: 0x87ceeb, // 天蓝色
      type: 'standard',
      structure: 'tri-part', // 三段式结构
      proportions: { shirt: 0.1, pants: 0.2 },
      body: { color: 0xffe44f, roughness: 0.8, metalness: 0.0 },
      shirt: { color: 0xffffff, roughness: 0.9, metalness: 0.0 },
      pants: { color: 0x966941, roughness: 0.9, metalness: 0.0 },
      eye: { color: 0xffffff, roughness: 0.2, metalness: 0.0 },
      pupil: { color: 0x000000, roughness: 0.0 },
      eyebrow: { color: 0x000000, roughness: 0.8, angle: 0 },
    },
    classic: {
      background: 0x2a2a2a, // 深灰色
      type: 'standard',
      structure: 'uni-body', // 一体式结构
      proportions: { shirt: 0, pants: 0 },
      body: { color: 0x008cff, roughness: 0.5, metalness: 0.1 }, // 蓝色身体
      eye: { color: 0xffffff, roughness: 0.2, metalness: 0.0 }, // 改为白色眼球
      pupil: { color: 0x000000, roughness: 0.1 }, // 改为黑色瞳仁
      eyebrow: { color: 0xcccccc, roughness: 0.8, angle: -0.15 },
    },
    toon: {
      background: 0xbde8ff, // 柔和天蓝
      type: 'toon',
      structure: 'tri-part', // 改为三段式
      proportions: { shirt: 0.25, pants: 0.35 }, // 衬衫+裤子比例
      body: { color: 0xffdab9 }, // 柔和肤色
      shirt: { color: 0xffdab9 }, // 改为与身体相同的肤色，实现无衬衫效果
      pants: { color: 0x4a6b96 }, // 牛仔蓝色
      eye: { color: 0xffffff, roughness: 0.1 }, // 保持白色，但让它更光滑以区别于衬衫
      pupil: { color: 0x222222 },
      eyebrow: { color: 0x5c4033, angle: 0.2 },
    },
    cyberpunk: {
      background: 0x12081a, // 深紫色
      type: 'standard',
      structure: 'tri-part',
      proportions: { shirt: 0.3, pants: 0.25 },
      body: { color: 0x333333, roughness: 0.4, metalness: 0.8 },
      shirt: { color: 0x222222, roughness: 0.5, metalness: 0.5, emissive: 0xff00ff, emissiveIntensity: 1.5 },
      pants: { color: 0x181818, roughness: 0.8, metalness: 0.2, emissive: 0x00ffff, emissiveIntensity: 1.5 },
      eye: { color: 0xffffff, emissive: 0xff00ff, roughness: 0.1, metalness: 0.1, emissiveIntensity: 2.5 },
      pupil: { color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 3.0 },
      eyebrow: { color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.0, angle: -0.25 },
    },
    alien: {
      background: 0x05020d, // 深空紫
      type: 'standard',
      structure: 'uni-body',
      proportions: { shirt: 0, pants: 0 },
      body: { color: 0x98fb98, roughness: 0.6, metalness: 0.1 }, // 浅绿色皮肤
      eye: { color: 0x0a0a0a, roughness: 0.05, metalness: 1.0 }, // 乌黑发亮的眼睛
      pupil: { color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 2.0 },
      eyebrow: { color: 0x32cd32, roughness: 0.8, angle: 0.3 },
    }
  };

  let meshes: { [key: string]: THREE.Mesh | THREE.Group } = {};
  let materials: { [key: string]: THREE.Material } = {};
  let currentThemeName = 'spongebob';
  let isMounted = false;
  let modelGroup: THREE.Group;
  // appState 作为内部状态，可以通过组件实例访问
  let appState = $state({
    underbust: 84,
    targetBust: 95.99,
    foundShape: 0,
  });

  // ============================================================================
  // 模型几何常量
  // ============================================================================
  const TORSO_HEIGHT = 40;
  const BUST_Y_POS = TORSO_HEIGHT * 0.118;
  const PIECEWISE_THRESHOLD = 50;
  const PI = Math.PI;
  const PUPIL_RADIUS_FACTOR = 0.4;
  const PUPIL_Z_OFFSET = 0.1;
  const EYEBROW_WIDTH_FACTOR = 1.8;
  const EYEBROW_HEIGHT_FACTOR = 0.25;
  const EYEBROW_Y_OFFSET_FACTOR = 1.6;
  const EYEBROW_Z_OFFSET = 0.2;

  // ============================================================================
  // 模型组位置配置（可在此处微调模型整体位置）
  // ============================================================================
  const MODEL_GROUP_POSITION = {
    x: 0,                    // 水平位置，正值=向右，负值=向左
    y: 0,                     // 垂直位置，正值=向上，负值=向下
    z: 0                      // 深度位置，正值=向前，负值=向后
  };

  // ============================================================================
  // 相机位置和角度配置（可在此处微调模型视角）
  // ============================================================================
  // 相机位置：从右上方看模型，类似"男友看女友"的高度差
  // - x: 右侧距离（正值=右侧，负值=左侧）
  // - y: 高度（相对于模型中心）
  // - z: 前方距离（正值=前方，负值=后方）
  const CAMERA_POSITION = {
    x: 40,                    // 右侧距离，增大=更靠右
    y: TORSO_HEIGHT * 0.5 + 15, // 高度，增大=更高，减小=更低
    z: 40                    // 前方距离，增大=更靠前
  };

  // 相机目标点偏移（相对于模型组位置的偏移）
  // 可以设置相机看向模型旁边的某个点
  const CAMERA_TARGET_OFFSET = {
    x: -15,                     // 水平偏移，正值=向右偏移，负值=向左偏移
    y: BUST_Y_POS,            // 垂直偏移（相对于模型组中心），正值=向上，负值=向下
    z: 0                      // 深度偏移，正值=向前偏移，负值=向后偏移
  };

  // 相机目标点（相机看向的位置）
  // 计算方式：模型组位置 + 偏移量
  const CAMERA_TARGET = {
    x: MODEL_GROUP_POSITION.x + CAMERA_TARGET_OFFSET.x,
    y: MODEL_GROUP_POSITION.y + CAMERA_TARGET_OFFSET.y,
    z: MODEL_GROUP_POSITION.z + CAMERA_TARGET_OFFSET.z
  };

  // 相机视野角度（FOV）
  const CAMERA_FOV = 75;      // 视野角度，增大=更广角，减小=更窄角

  const GEOMETRY_ENGINE = {
    getShapeParams: (shapeValue: number, x: number) => {
      const r_hemi = x / 2;
      if (shapeValue < PIECEWISE_THRESHOLD) {
        const shapeNorm = shapeValue / PIECEWISE_THRESHOLD;
        const r_max = x * 100;
        const r_min = r_hemi + 0.001;
        const r_A = r_max * Math.pow(r_min / r_max, shapeNorm);
        const h = r_A - Math.sqrt(r_A * r_A - r_hemi * r_hemi);
        return {
          mode: '球面 (c=x)',
          r_A: r_A, h: h, y: 0, r_hemi: r_hemi
        };
      } else {
        const shapeNorm = (shapeValue - PIECEWISE_THRESHOLD) / (100 - PIECEWISE_THRESHOLD);
        const y = shapeNorm * x * 1.5;
        const h = y + r_hemi;
        return {
          mode: '圆柱 (c=x)',
          r_A: r_hemi, h: h, y: y, r_hemi: r_hemi
        };
      }
    },
    calculateBustCircumference: (params: { y: number; r_A: number; r_hemi: number; }, x: number) => {
      if (params.y === 0) {
        const { r_A, r_hemi } = params;
        const arcLength = 2 * r_A * Math.asin(r_hemi / r_A);
        return (5 * x) + arcLength;
      } else {
        const { y } = params;
        return (5 * x) + (2 * y) + (PI * x / 2);
      }
    }
  };

  const SOLVER = {
    findShapeForCirc: (targetCirc: number, x: number) => {
      const params100 = GEOMETRY_ENGINE.getShapeParams(100, x);
      const circAt100 = GEOMETRY_ENGINE.calculateBustCircumference(params100, x);

      if (targetCirc <= circAt100) {
        let minShape = 0;
        let maxShape = 100;
        for (let i = 0; i < 15; i++) {
          const midShape = (minShape + maxShape) / 2;
          const params = GEOMETRY_ENGINE.getShapeParams(midShape, x);
          const currentCirc = GEOMETRY_ENGINE.calculateBustCircumference(params, x);
          if (currentCirc < targetCirc) minShape = midShape;
          else maxShape = midShape;
        }
        return (minShape + maxShape) / 2;
      } else {
        const y_target = (targetCirc - (5 * x) - (PI * x / 2)) / 2;
        const shapeNorm_target = y_target / (x * 1.5);
        const shape_target = shapeNorm_target * 50 + 50;
        return shape_target;
      }
    }
  };

  function _setupScene() {
    if (!container) return;
    
    scene = new THREE.Scene();
    const containerWidth = container.clientWidth || container.offsetWidth || 400;
    const containerHeight = container.clientHeight || container.offsetHeight || 400;
    const aspect = containerWidth > 0 && containerHeight > 0 ? containerWidth / containerHeight : 1;
    
    // 使用配置的相机参数
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 1000);
    camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setClearColor(0x000000, 0); // 透明背景
    container.appendChild(renderer.domElement);

    // 使用配置的目标点
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update(); // 立即更新控制器以应用初始位置
  }

  function _setupGeometry() {
    // 创建模型组，用于整体控制模型位置
    modelGroup = new THREE.Group();
    modelGroup.position.set(
      MODEL_GROUP_POSITION.x,
      MODEL_GROUP_POSITION.y,
      MODEL_GROUP_POSITION.z
    );

    const boxGeo = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
    meshes.torsoTop = new THREE.Mesh(boxGeo, materials.body);
    meshes.torsoShirt = new THREE.Mesh(boxGeo, materials.shirt);
    meshes.torsoPants = new THREE.Mesh(boxGeo, materials.pants);

    meshes.leftEyeGroup = new THREE.Group();
    meshes.rightEyeGroup = new THREE.Group();
    meshes.leftEyeball = new THREE.Mesh(new THREE.BufferGeometry(), materials.eye);
    meshes.rightEyeball = new THREE.Mesh(new THREE.BufferGeometry(), materials.eye);
    meshes.leftPupil = new THREE.Mesh(new THREE.CircleGeometry(1, 16), materials.pupil);
    meshes.rightPupil = new THREE.Mesh(new THREE.CircleGeometry(1, 16), materials.pupil);
    (meshes.leftPupil as THREE.Mesh).renderOrder = 1;
    (meshes.rightPupil as THREE.Mesh).renderOrder = 1;

    meshes.leftEyebrow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materials.eyebrow);
    meshes.rightEyebrow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materials.eyebrow);

    meshes.leftEyeGroup.add(meshes.leftEyeball, meshes.leftPupil, meshes.leftEyebrow);
    meshes.rightEyeGroup.add(meshes.rightEyeball, meshes.rightPupil, meshes.rightEyebrow);

    // 将所有模型元素添加到模型组中
    modelGroup.add(
      meshes.torsoTop, meshes.torsoShirt, meshes.torsoPants,
      meshes.leftEyeGroup, meshes.rightEyeGroup
    );

    // 将模型组添加到场景
    scene.add(modelGroup);
    _updateVisibility();
  }

  function _onWindowResize() {
    if (!container || !camera || !renderer) return;
    const containerWidth = container.clientWidth || container.offsetWidth || 400;
    const containerHeight = container.clientHeight || container.offsetHeight || 400;
    const aspect = containerWidth > 0 && containerHeight > 0 ? containerWidth / containerHeight : 1;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
  }

  function _updateStateFromUI() {
    const x = appState.underbust / 6.0;
    appState.foundShape = SOLVER.findShapeForCirc(appState.targetBust, x);
  }

  function _updateGeometries() {
    const x = appState.underbust / 6.0;
    const width = 2 * x;
    const halfDepth = x / 2;
    const params = GEOMETRY_ENGINE.getShapeParams(appState.foundShape, x);

    _updateEyeballGeometry(params);
    _updatePupilGeometry(params);
    _updateEyebrowGeometry(params);
    _updateTorsoAppearance(width, x);

    const BUST_X_POS = width * 0.25;
    const eyeGroupZOffset = halfDepth + 0.05;
    (meshes.leftEyeGroup as THREE.Group).position.set(-BUST_X_POS, BUST_Y_POS, eyeGroupZOffset);
    (meshes.rightEyeGroup as THREE.Group).position.set(BUST_X_POS, BUST_Y_POS, eyeGroupZOffset);
    return params;
  }

  function _updateEyeballGeometry(params: { mode: string; y: number; r_hemi: number; r_A: number; h: number; }) {
    let bustGeo;
    if (params.mode === '圆柱 (c=x)') {
      const { y, r_hemi } = params;
      const cylinderGeo = new THREE.CylinderGeometry(r_hemi, r_hemi, y, 24, 1);
      const sphereGeo = new THREE.SphereGeometry(r_hemi, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      cylinderGeo.translate(0, y / 2, 0);
      sphereGeo.translate(0, y, 0);
      bustGeo = mergeGeometries([cylinderGeo, sphereGeo]);
      bustGeo.rotateX(Math.PI / 2);
    } else {
      const { r_A, r_hemi, h } = params;
      const thetaLength = Math.asin(r_hemi / r_A);
      bustGeo = new THREE.SphereGeometry(r_A, 24, 12, 0, Math.PI * 2, 0, thetaLength);
      bustGeo.rotateX(Math.PI / 2);
      bustGeo.translate(0, 0, -(r_A - h));
    }
    (meshes.leftEyeball as THREE.Mesh).geometry.dispose();
    (meshes.rightEyeball as THREE.Mesh).geometry.dispose();
    (meshes.leftEyeball as THREE.Mesh).geometry = bustGeo;
    (meshes.rightEyeball as THREE.Mesh).geometry = bustGeo.clone();
  }

  function _updatePupilGeometry(params: { r_hemi: number; h: number; }) {
    const pupilRadius = params.r_hemi * PUPIL_RADIUS_FACTOR;
    (meshes.leftPupil as THREE.Mesh).scale.set(pupilRadius, pupilRadius, 1);
    (meshes.rightPupil as THREE.Mesh).scale.set(pupilRadius, pupilRadius, 1);
    const pupilZOffset = params.h + PUPIL_Z_OFFSET;
    (meshes.leftPupil as THREE.Mesh).position.z = pupilZOffset;
    (meshes.rightPupil as THREE.Mesh).position.z = pupilZOffset;
  }

  function _updateEyebrowGeometry(params: { r_hemi: number; }) {
    const eyebrowWidth = params.r_hemi * EYEBROW_WIDTH_FACTOR;
    const eyebrowHeight = eyebrowWidth * EYEBROW_HEIGHT_FACTOR;
    (meshes.leftEyebrow as THREE.Mesh).scale.set(eyebrowWidth, eyebrowHeight, 1);
    (meshes.rightEyebrow as THREE.Mesh).scale.set(eyebrowWidth, eyebrowHeight, 1);

    const eyebrowYOffset = params.r_hemi * EYEBROW_Y_OFFSET_FACTOR;
    (meshes.leftEyebrow as THREE.Mesh).position.y = eyebrowYOffset;
    (meshes.rightEyebrow as THREE.Mesh).position.y = eyebrowYOffset;

    (meshes.leftEyebrow as THREE.Mesh).position.z = EYEBROW_Z_OFFSET;
    (meshes.rightEyebrow as THREE.Mesh).position.z = EYEBROW_Z_OFFSET;

    const theme = THEMES[currentThemeName];
    (meshes.leftEyebrow as THREE.Mesh).rotation.z = theme.eyebrow.angle || 0;
    (meshes.rightEyebrow as THREE.Mesh).rotation.z = -(theme.eyebrow.angle || 0);
  }

  function _setupMaterials(theme: any) {
    for (const key of ['body', 'shirt', 'pants', 'eye', 'pupil', 'eyebrow']) {
      if (theme[key]) {
        const { angle, ...materialProps } = { ...theme[key] };
        const MaterialClass = THREE.MeshStandardMaterial;

        if (key === 'pupil') {
          materialProps.side = THREE.DoubleSide;
          materialProps.depthTest = false;
        }
        materials[key] = new MaterialClass(materialProps);
      }
    }
  }

  function _setupLighting(theme: any) {
    scene.children.filter(obj => obj.isLight).forEach(light => scene.remove(light));
    if (theme.type === 'toon') {
      const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2.5);
      light.position.set(0, 100, 0);
      scene.add(light);
    } else {
      const ambient = new THREE.AmbientLight(0x404040, 2);
      const light = new THREE.DirectionalLight(0xffffff, 2);
      light.position.set(10, 30, 50);
      scene.add(ambient, light);
    }
  }

  function _applyMaterials() {
    (meshes.torsoTop as THREE.Mesh).material = materials.body;
    (meshes.torsoShirt as THREE.Mesh).material = materials.shirt;
    (meshes.torsoPants as THREE.Mesh).material = materials.pants;
    (meshes.leftEyeball as THREE.Mesh).material = (meshes.rightEyeball as THREE.Mesh).material = materials.eye;
    (meshes.leftPupil as THREE.Mesh).material = (meshes.rightPupil as THREE.Mesh).material = materials.pupil;
    (meshes.leftEyebrow as THREE.Mesh).material = (meshes.rightEyebrow as THREE.Mesh).material = materials.eyebrow;
  }

  function _updateVisibility() {
    const theme = THEMES[currentThemeName];
    const isTriPart = theme.structure === 'tri-part';
    (meshes.torsoShirt as THREE.Mesh).visible = isTriPart;
    (meshes.torsoPants as THREE.Mesh).visible = isTriPart;
  }

  function _updateTorsoAppearance(width: number, x: number) {
    const theme = THEMES[currentThemeName];
    if (theme.structure === 'tri-part') {
      const shirtHeight = TORSO_HEIGHT * theme.proportions.shirt;
      const pantsHeight = TORSO_HEIGHT * theme.proportions.pants;
      const topHeight = TORSO_HEIGHT - shirtHeight - pantsHeight;
      (meshes.torsoTop as THREE.Mesh).scale.set(width, topHeight, x);
      (meshes.torsoTop as THREE.Mesh).position.y = (shirtHeight + pantsHeight) / 2;
      (meshes.torsoShirt as THREE.Mesh).scale.set(width, shirtHeight, x);
      (meshes.torsoShirt as THREE.Mesh).position.y = (pantsHeight - topHeight) / 2;
      (meshes.torsoPants as THREE.Mesh).scale.set(width, pantsHeight, x);
      (meshes.torsoPants as THREE.Mesh).position.y = (-topHeight - shirtHeight) / 2;
    } else {
      (meshes.torsoTop as THREE.Mesh).scale.set(width, TORSO_HEIGHT, x);
      (meshes.torsoTop as THREE.Mesh).position.y = 0;
      (meshes.torsoShirt as THREE.Mesh).scale.set(0, 0, 0);
      (meshes.torsoPants as THREE.Mesh).scale.set(0, 0, 0);
    }
  }

  function _animate() {
    requestAnimationFrame(_animate);
    controls.update();
    renderer.render(scene, camera);
  }

  export function updateApp() {
    _updateStateFromUI();
    const params = _updateGeometries();
    // Update appState reactively
    Object.assign(appState, {
      mode: params.mode,
      x: appState.underbust / 6.0,
      y: params.y,
      r_A: params.r_A,
    });
    return params;
  }

  export function updateState(underbust: number, targetBust: number) {
    appState.underbust = underbust;
    appState.targetBust = targetBust;
    appState.foundShape = 0;
    // 直接调用 updateApp() 确保更新
    if (isMounted) {
      updateApp();
    }
  }

  export function setTheme(themeName: string, isInitial = false) {
    currentThemeName = themeName;
    const theme = THEMES[themeName] || THEMES.spongebob;
    _setupMaterials(theme);
    _setupLighting(theme);
    // 保持场景背景透明，让模型融入页面
    scene.background = null;

    if (!isInitial) {
      _applyMaterials();
      _updateVisibility();
      updateApp();
    }
  }

  // 监听 appState 变化，自动更新模型（作为备用机制）
  $effect(() => {
    // 只在组件挂载后响应变化
    if (isMounted && appState.underbust && appState.targetBust) {
      // 延迟执行以避免重复更新
      setTimeout(() => {
        if (isMounted) {
          updateApp();
        }
      }, 0);
    }
  });

  onMount(() => {
    if (!container) return;
    
    // 确保容器有尺寸后再初始化
    const initScene = () => {
      if (!container) return;
      const width = container.clientWidth || container.offsetWidth;
      const height = container.clientHeight || container.offsetHeight;
      if (width === 0 || height === 0) {
        // 如果容器还没有尺寸，等待下一帧
        requestAnimationFrame(initScene);
        return;
      }
      
      _setupScene();
      // 确保场景背景透明
      if (scene) {
        scene.background = null;
      }
      setTheme(currentThemeName, true);
      _setupGeometry();
      updateApp();
      isMounted = true;
      _animate();
    };
    
    initScene();
    window.addEventListener('resize', _onWindowResize);

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      if (container && renderer && camera) {
        const containerWidth = container.clientWidth || container.offsetWidth || 400;
        const containerHeight = container.clientHeight || container.offsetHeight || 400;
        const aspect = containerWidth > 0 && containerHeight > 0 ? containerWidth / containerHeight : 1;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(containerWidth, containerHeight);
      }
    });
    
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('resize', _onWindowResize);
      resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
      }
      // any other cleanup
    }
  });
</script>

<div bind:this={container}></div>