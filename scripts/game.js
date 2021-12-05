class Game {
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1);
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xccdeee });
  BONUS_PREFAB = new THREE.SphereBufferGeometry(1, 12, 12);

  COLLISION_THRESHOLD = 0.2;

  constructor(scene, camera) {
    // initialize variables
    this.speedZ = 20;
    this.speedX = 0; // -1: left, 0: straight, 1: right
    this.translateX = 0;
    this.health = 50;
    this.score = 0;

    this.running = false;

    // html dom elements
    this.domHealth = document.getElementById('health')
    this.domScore = document.getElementById('score')
    this.domDistance = document.getElementById('distance')

    document.getElementById('start-button').addEventListener('click', () => {
      this.running = true;
      document.getElementById('intro-panel').style.display = 'none'
    })

    this.domGameOverPanel = document.getElementById("game-over-panel");
    this.domGameOverScore = document.getElementById("game-over-score");
    this.domGameOverDistance = document.getElementById("game-over-distance");

    // initialise dom elements
    this.domScore.innerText = this.score;
    this.domDistance.innerText = 0;
    this.domHealth.value = this.health;

    // prepare 3D scene
    this._initializeScene(scene, camera);

    // bind event callbacks

    document.addEventListener("keydown", this._keydown.bind(this));
    document.addEventListener("keyup", this._keyup.bind(this));
  }

  update() {
    // event handling
    // recompute the game state

    if(!this.running)
    return

    this.time += this.clock.getDelta();

    this.translateX += this.speedX * -0.05;

    this._updateGrid();
    this._checkCollisions();
    this._updateInfoPanel();
  }

  _keydown(event) {
    // check for the key to move the ship accordingly
    let newSpeedX;
    switch(event.key){
        case 'ArrowLeft': 
            newSpeedX = -1.0;
            break;
        case 'ArrowRight':
            newSpeedX = 1.0;
            break;
        default: 
            return;
    }

    this.speedX = newSpeedX;
  }

  _keyup() {
    // reset to 'idle' mode
    this.speedX = 0;
  }

  _updateGrid() {
    // "move" the grid backwards so that it feels like we are moving forward.
    this.grid.material.uniforms.time.value = this.time;
    this.objectsParent.position.z = this.speedZ * this.time;

    this.grid.material.uniforms.translateX.value = this.translateX;
    this.objectsParent.position.x = this.translateX;

    this.objectsParent.traverse((child) => {
        if(child instanceof THREE.Mesh){
            //  Z-position in world space
            const childZPos = child.position.z + this.objectsParent.position.z;
            if(childZPos > 0){
                // reset the object
                const params = [child, this.ship.position.x, -this.objectsParent.position.z]
                if(child.userData.type === 'obstacle'){
                    this._setupObstacle(...params);
                }else{
                    const price = this._setUpBonus(...params);
                    child.userData.price = price;
                }
            }
        }
    })
  }

  _checkCollisions() {
    // check obstacles
    // check bonuses

    this.objectsParent.traverse((child) => {
        if(child instanceof THREE.Mesh){
            // pos in world space
            const childZPos = child.position.z + this.objectsParent.position.z;

            // threshold distances
            const thresholdX = this.COLLISION_THRESHOLD + child.scale.x / 2;
            const thresholdZ = this.COLLISION_THRESHOLD + child.scale.z / 2;

            // check for collision
            if(
                childZPos > -thresholdZ && Math.abs(child.position.x + this.translateX) < thresholdX
            ){
                const params = [child, -this.translateX, -this.objectsParent.position.z];
                // collision
                if(child.userData.type === 'obstacle'){
                    //  reduce health
                    if(this.health <= 0)
                      this._gameOver();

                    this.health -= 10;
                    this.domHealth.value = this.health
                    this._setupObstacle(...params)
                }else{
                    // increase score
                    this.score += child.userData.price;
                    this.domScore.innerText = this.score
                    child.userData.price = this._setUpBonus(...params)
                }
            }
        }
    })
  }

  _updateInfoPanel() {
    this.domDistance.innerText = this.objectsParent.position.z.toFixed(0);
  }

  _gameOver() {
    // prepare end state
    this.running = false;
    //  show "end state" UI
    this.domGameOverPanel.style.display = 'flex';
    this.domGameOverScore.innerText = this.score;
    this.domGameOverDistance.innerText = this.objectsParent.position.z.toFixed(0);
    //  reset instance variables for a new game
  }

  _createShip(scene) {
    // ship
    const shipBody = new THREE.Mesh(
      new THREE.TetrahedronBufferGeometry(0.4),
      new THREE.MeshBasicMaterial({ color: 0xbbccdd })
    );

    //  rotate the ship
    shipBody.rotateX((45 * Math.PI) / 180);
    shipBody.rotateY((45 * Math.PI) / 180);

    // reactor-sockets
    const reactorSocketGeometry = new THREE.CylinderBufferGeometry(
      0.08,
      0.08,
      0.1,
      16
    );
    const reactorSocketMaterial = new THREE.MeshBasicMaterial({
      color: 0x99aacc,
    });

    const reactorSocket1 = new THREE.Mesh(
      reactorSocketGeometry,
      reactorSocketMaterial
    );
    const reactorSocket2 = new THREE.Mesh(
      reactorSocketGeometry,
      reactorSocketMaterial
    );
    const reactorSocket3 = new THREE.Mesh(
      reactorSocketGeometry,
      reactorSocketMaterial
    );

    //  reactor-lights
    const reactorLightGeometry = new THREE.CylinderBufferGeometry(
      0.055,
      0.055,
      0.1,
      16
    );
    const reactorLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xaadeff,
    });

    const reactorLight1 = new THREE.Mesh(
      reactorLightGeometry,
      reactorLightMaterial
    );
    const reactorLight2 = new THREE.Mesh(
      reactorLightGeometry,
      reactorLightMaterial
    );
    const reactorLight3 = new THREE.Mesh(
      reactorLightGeometry,
      reactorLightMaterial
    );

    // create a virtual anchor to make a sub-hierarchy in the scene
    this.ship = new THREE.Group();
    this.ship.add(shipBody);

    // add the group itself to the scene
    scene.add(this.ship);

    this.ship.add(reactorSocket1);
    this.ship.add(reactorSocket2);
    this.ship.add(reactorSocket3);

    reactorSocket1.rotateX((90 * Math.PI) / 180);
    reactorSocket1.position.set(-0.15, 0, 0.1);
    reactorSocket2.rotateX((90 * Math.PI) / 180);
    reactorSocket2.position.set(0.15, 0, 0.1);
    reactorSocket3.rotateX((90 * Math.PI) / 180);
    reactorSocket3.position.set(0, -0.15, 0.1);

    this.ship.add(reactorLight1);
    this.ship.add(reactorLight3);
    this.ship.add(reactorLight2);

    reactorLight1.rotateX((90 * Math.PI) / 180);
    reactorLight1.position.set(-0.15, 0, 0.11);
    reactorLight2.rotateX((90 * Math.PI) / 180);
    reactorLight2.position.set(0.15, 0, 0.11);
    reactorLight3.rotateX((90 * Math.PI) / 180);
    reactorLight3.position.set(0, -0.15, 0.11);
  }

  _createGrid(scene) {

    let divisions = 30;
    let gridLimit = 200;
    this.grid = new THREE.GridHelper(
      gridLimit * 2,
      divisions,
      0xccddee,
      0xccddee
    );

    const moveableZ = [];
    const moveableX = [];
    for (let i = 0; i <= divisions; i++) {
      moveableX.push(0, 0, 1, 1) // vertical lines
      moveableZ.push(1, 1, 0, 0); // move horizontal lines only (1 - point is moveable)
    }
    this.grid.geometry.setAttribute('moveableX', new THREE.BufferAttribute(new Uint8Array(moveableX), 1));
    this.grid.geometry.setAttribute("moveableZ",new THREE.BufferAttribute(new Uint8Array(moveableZ), 1));

    this.grid.material = new THREE.ShaderMaterial({
      uniforms: {
        speedZ: {
          value: this.speedZ,
        },
        translateX: {
          value: this.translateX,
        },
        gridLimits: {
          value: new THREE.Vector2(-gridLimit, gridLimit),
        },
        time: {
          value: 0,
        },
      },
      vertexShader: `
        uniform float time;
        uniform vec2 gridLimits;
        uniform float speedZ;
        uniform float translateX;
        
        attribute float moveableX;
        attribute float moveableZ;
        
        varying vec3 vColor;
      
        void main() {
          vColor = color;
          float limLen = gridLimits.y - gridLimits.x;
          vec3 pos = position;
          if (floor(moveableX + 0.5) > 0.5) { // if a point has "moveableX" attribute = 1 
            float xDist = translateX;
            float curXPos = mod((pos.x + xDist) - gridLimits.x, limLen) + gridLimits.x;
            pos.x = curXPos;
          }
          if (floor(moveableZ + 0.5) > 0.5) { // if a point has "moveableZ" attribute = 1 
            float zDist = speedZ * time;
            float curZPos = mod((pos.z + zDist) - gridLimits.x, limLen) + gridLimits.x;
            pos.z = curZPos;
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
      
        void main() {
          gl_FragColor = vec4(vColor, 1.); // r, g, b channels + alpha (transparency)
        }
      `,
      vertexColors: THREE.VertexColors,
    });

    scene.add(this.grid);

    this.time = 0;
    this.clock = new THREE.Clock();
  }

  _spawnObstacle() {
    const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.OBSTACLE_MATERIAL);

    // add randomness
    this._setupObstacle(obj);

    this.objectsParent.add(obj);
    obj.userData = { type: 'obstacle' };
  }

  _spawnBonus() {
    const obj = new THREE.Mesh(
      this.BONUS_PREFAB,
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );

    const price = this._setUpBonus(obj);

    this.objectsParent.add(obj);
    obj.userData = { type: 'bonus', price };
  }

  _setupObstacle(obj, refXPos = 0, refZPos = 0) {
    // random scale
    obj.scale.set(
      this._randomFloat(0.5, 2),
      this._randomFloat(0.5, 2),
      this._randomFloat(0.5, 2)
    );

    // random position
    obj.position.set(
      refXPos + this._randomFloat(-30, 30),
      obj.scale.y * 0.5,
      refZPos - 100 - this._randomFloat(0, 100)
    );
  }

  _setUpBonus(obj, refXPos = 0, refZPos = 0) {
    const price = this._randomInt(5, 20);
    const ratio = price / 20;

    const size = ratio * 0.5;
    obj.scale.set(size, size, size);

    const hue = 0.5 + 0.5 * ratio;
    obj.material.color.setHSL(hue, 1, 0.5);

    obj.position.set(
      refXPos + this._randomFloat(-30, 30),
      obj.scale.y * 0.5,
      refZPos - 100 - this._randomFloat(0, 100)
    );

    return price;
  }

  _randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  _randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _initializeScene(scene, camera) {
    //  prepare the game-specific 3D scene

    this._createShip(scene);
    this._createGrid(scene);

    this.objectsParent = new THREE.Group();
    scene.add(this.objectsParent);

    // spawn 10 obstacles
    for (let i = 0; i < 10; i++) this._spawnObstacle();

    // spawn 10 bonuses
    for(let i =0; i < 10; i++) this._spawnBonus();

    camera.rotateX((-20 * Math.PI) / 180);
    camera.position.set(0, 1.5, 2);
  }
}
