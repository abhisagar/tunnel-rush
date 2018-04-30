var Rotation = 0.0;
var Rotation_obs1 = new Array(2);
var Rotation_obs2 = new Array(2);
var speed_obs1 = new Array(2);
var speed_obs2 = new Array(2);
var distance_covered=0, block_size=4;
var modelViewMatrix, projectionMatrix, projectionMatrix2, projectionMatrix3;
var modelViewMatrix_obs = new Array(2);
var modelViewMatrix3 = new Array(2);
var radius = math.sqrt(2);
var index=9, index_obs1=1, index_obs2 = 1;
var width_arr = new Array(10);
var width_obs1 = new Array(2);
var width_obs2 = new Array(2);
var done_obs1 = new Array(2);
var done_obs2 = new Array(2);
var my_speed = 0.05, tunnel_speed=0.03;
var change = 0, jump_height=0, jump_flag = 0, jump_speed=0, collision_detected=0;
var my_level = 1, score = 0, pause = 0;
main();

function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  canvas.style = "position: absolute; top: 150px; left: 450px;"

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 

// 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
  
    const vsSource_color = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0, -0.8, 1.5));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
  `;

    const fsSource_color = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;


  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const shaderProgram_color = initShaderProgram(gl, vsSource_color, fsSource_color);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
     // vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };
  const programInfo_color = {
  program: shaderProgram_color,
  attribLocations: {
    vertexPosition: gl.getAttribLocation(shaderProgram_color, 'aVertexPosition'),
    vertexColor: gl.getAttribLocation(shaderProgram_color, 'aVertexColor'),
  },
  uniformLocations: {
    projectionMatrix: gl.getUniformLocation(shaderProgram_color, 'uProjectionMatrix'),
    modelViewMatrix: gl.getUniformLocation(shaderProgram_color, 'uModelViewMatrix'),
  },
  };

   const texture =  loadTexture(gl, 'cubetexture5.jpeg');
   const texture1 = loadTexture(gl, 'cubetexture4.jpg');
   const texture2 = loadTexture(gl, 'cubetexture6.jpg');
   const texture3 = loadTexture(gl, 'cubetexture7.jpg');
  

  
  var Key = {
    _pressed: {},

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    PAUSE: 80,
  
    isDown: function(keyCode) {
      return this._pressed[keyCode];
    },
  
    onKeydown: function(event) {
      this._pressed[event.keyCode] = true;
    },
  
    onKeyup: function(event) {
      delete this._pressed[event.keyCode];
    }
  };
  window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
  window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);



  document.addEventListener('keyup',function(event){
    if(event.keyCode==84)
    {
      change++;
    }
  });
  for (var i=0;i<10;i++)
    width_arr[i] = -i*block_size;

  // for obs1
  for (var i=0;i<2;i++)
    width_obs1[i] = -i*16-5;
  for (var i=0;i<2;i++) {
    Rotation_obs1[i] = math.random()/20;
    done_obs1[i] = 0;
    if (i==0)
      speed_obs1[i] = Rotation_obs1[i];
    else
      speed_obs1[i] = -Rotation_obs1[i];
  }

  // for obs2
  for (var i=0;i<2;i++) 
    width_obs2[i] = (-i)*16+3;
  for (var i=0;i<2;i++) {
    Rotation_obs2[i] = math.random()/20;
    done_obs2[i] = 0;
    if (i%2)
      speed_obs2[i] = Rotation_obs2[i];
    else
      speed_obs2[i] = -Rotation_obs2[i];
  }

  var then = 0;
  function render(now) {
    // console.log (score);
    document.getElementById('Score').innerHTML = "Score : " + score.toString();
    document.getElementById('Speed').innerHTML = "Speed : " + (tunnel_speed.toFixed(4)).toString();
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
	  var width = 1;
	   // if (change%2==1)
  

    // if (Key.isDown(Key.UP)) this.moveUp();
    if (Key.isDown(Key.LEFT) && collision_detected == 0){ 
      Rotation+=my_speed;
      for (var i=0;i<2;i++) {
        Rotation_obs1[i] += my_speed;
        Rotation_obs2[i] += my_speed;
      }
    }
    // if (Key.isDown(Key.DOWN)) this.moveDown();
    if (Key.isDown(Key.RIGHT) && collision_detected == 0) {
      Rotation-=my_speed;
      for (var i=0;i<2;i++) {
        Rotation_obs1[i] -= my_speed;
        Rotation_obs2[i] -= my_speed;
      }
    }

    if (Key.isDown(Key.SPACE) && jump_flag == 0 && collision_detected == 0) {

        jump_flag=1;
        jump_speed=0.1;
    }

    if (jump_flag) {

        jump_height+=jump_speed;
        jump_speed-=0.004;
        if (jump_height<=0) {
          jump_height=0;
          jump_flag=0;
        }
    }

    if (Key.isDown(Key.PAUSE) && collision_detected == 0)
      pause = (pause+1)%2;
    console.log(pause);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var fieldOfView = 60 * math.PI / 180;   // in radians
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 0.1;
    var zFar = 100.0;
    projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
    modelViewMatrix = mat4.create();

    if (collision_detected == 0 && pause==0) {
      if (my_level == 1)
        tunnel_speed = 0.03;
      if (my_level == 2)
        tunnel_speed += 0.0001;
      if (my_level == 3)
        tunnel_speed += 0.0005;
  }

    if (collision_detected == 0 && pause==0)
      distance_covered+=tunnel_speed;
    // console.log (distance_covered);
    if (distance_covered >= 25 && my_level == 1)
      my_level = 2;
    if (distance_covered >= 75 && my_level == 2)
      my_level = 3;
    

    mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   [0.0, 1.0-jump_height, distance_covered]);  // amount to translate
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                Rotation,     // amount to rotate in radians
                [0, 0, 1]);       // axis to rotate around (Z)
    // mat4.rotate(modelViewMatrix,  // destination matrix
    //             modelViewMatrix,  // matrix to rotate
    //             cubeRotation * .7,// amount to rotate in radians
    //             [0, 1, 0]);       // axis to rotate around (X)
    fieldOfView = 60 * math.PI / 180;   // in radians
    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    zNear = 0.1;
    zFar = 100.0;
    projectionMatrix2 = mat4.create();
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix2,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
    for (var k=0;k<2;k++) {
      if (collision_detected == 0 && pause==0)
        Rotation_obs1[k] += speed_obs1[k];
      modelViewMatrix_obs[k] = mat4.create();
      // distance_covered+=0.1;
      mat4.translate(modelViewMatrix_obs[k],     // destination matrix
                     modelViewMatrix_obs[k],     // matrix to translate
                     [0.0, 0.6 - jump_height, distance_covered]);  // amount to translate
      mat4.rotate(modelViewMatrix_obs[k],  // destination matrix
                  modelViewMatrix_obs[k],  // matrix to rotate
                  Rotation_obs1[k],     // amount to rotate in radians
                  [0, 0, 1]);       // axis to rotate around (Z)
  	}

    fieldOfView = 60 * math.PI / 180;   // in radians
    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    zNear = 0.1;
    zFar = 100.0;
    projectionMatrix3 = mat4.create();
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix3,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
    for (var k=0;k<2;k++) {
      if (collision_detected == 0 && pause == 0)
        Rotation_obs2[k] += speed_obs2[k];
      modelViewMatrix3[k] = mat4.create();
      // distance_covered+=0.1;
      mat4.translate(modelViewMatrix3[k],     // destination matrix
                     modelViewMatrix3[k],     // matrix to translate
                     [0.0, 0.6 - jump_height, distance_covered]);  // amount to translate
      mat4.rotate(modelViewMatrix3[k],  // destination matrix
                  modelViewMatrix3[k],  // matrix to rotate
                  Rotation_obs2[k],     // amount to rotate in radians
                  [0, 0, 1]);       // axis to rotate around (Z)
    }

    var octagonal_buffer=new Array(12);
    
    // for tunnel
    for (var i=0;i<10;i++) {
      if (distance_covered + width_arr[i] >= block_size) {
        width_arr[i] = width_arr[index] - block_size;
        index=(index+1)%10;
      }
    }
    for (var i=0;i<10;i++) 
      octagonal_buffer[i] = initBuffers(gl,i%8, width_arr[i]);
    if(change%2) {
      for(var i=0;i<10;i++)
        drawScene(gl, programInfo, octagonal_buffer[i], texture, deltaTime);
    
    }
    else {
      for(var i=0;i<10;i++)
        drawScene_color(gl, programInfo_color, octagonal_buffer[i], deltaTime); 
    
    }
    
    // for semi-circular obstacles
    var obstacle1 = new Array(2);
    for (var i=0;i<2;i++) {
      if (distance_covered+width_obs1[i] >= 0) {
        width_obs1[i] = -16+width_obs1[index_obs1];
        index_obs1=(index_obs1+1)%2;
        Rotation_obs1[i] = math.random()/20;
        done_obs1[i] = 0;
        if (i%2)
          speed_obs1[i] = -Rotation_obs1[i];
        else
          speed_obs1[i] = Rotation_obs1[i];
      }
    }
    for(var i=0;i<2;i++)
       obstacle1[i] = initialise_obstacle1(gl, width_obs1[i]);
    if(change%2==1) {
       for(var i=0;i<2;i++)  
          draw_obstacle1(gl, programInfo, obstacle1[i], texture1, deltaTime, i);
   
    }
    else {
       for(var i=0;i<2;i++)  
          draw_obstacle1(gl, programInfo, obstacle1[i], texture3, deltaTime, i);
   
    }

    // for ractangular obstacles
    var obstacle2 = new Array(2);
    for (var i=0;i<2;i++) {
      if (distance_covered+width_obs2[i] >= 0) {
        width_obs2[i] = -16+width_obs2[index_obs1];
        index_obs2=(index_obs2+1)%2;
        Rotation_obs2[i] = math.random()/100;
        done_obs2[i] = 0;
        if (i%2)
          speed_obs2[i] = Rotation_obs2[i];
        else
          speed_obs2[i] = -Rotation_obs2[i];
      }
    }
    for(var i=0;i<2;i++)
       obstacle2[i] = initialise_obstacle2(gl, width_obs2[i]);
    if(change%2==1)
    {
       for(var i=0;i<2;i++)  
          draw_obstacle2(gl, programInfo, obstacle2[i], texture1, deltaTime, i);
   
    }
    else
    {
       for(var i=0;i<2;i++)  
          draw_obstacle2(gl, programInfo, obstacle2[i], texture2, deltaTime, i);
   
    }

    // detecting collisions for obs1
    for (var i=0;i<2;i++) {
        var detection_window = 0.04;
        if (my_level == 2)
          detection_window = 0.1;
        if (my_level == 3)
          detection_window = 0.5;
        if ((math.abs(distance_covered + width_obs1[i]) <= detection_window) && done_obs1[i] == 0) {
            done_obs1[i] = 1;
            var temp = math.floor(Rotation_obs1[i]/(2*math.PI));
            var net_rotation = Rotation_obs1[i] - temp*(2*math.PI);
            // console.log(net_rotation);
            if (((net_rotation <= -(3*math.PI/8) && net_rotation >= -(11*math.PI/8))
                  || (net_rotation >= (5*math.PI/8) && net_rotation <= (13*math.PI/8))) && jump_flag==0) {
              // alert("collision detected");
              collision_detected = 1;
              alert("Game Over");
              // console.log("collision detected");
            }
            if (((net_rotation >= -(3*math.PI/8)) && net_rotation <= (5*math.PI/8)) && jump_flag==1) {
              // alert("jumping collision detected");
              // console.log("collision detected");
              collision_detected = 1;
              alert("Game Over");
            }

            if (collision_detected == 0) {
                if (my_level == 1)
                  score += 10;
                if (my_level == 2)
                  score += 30;
                if (my_level == 3)
                  score += 50;
            }
        }

    }

    // for collision with obs2
    for (var i=0;i<2;i++) {
        var detection_window = 0.04;
        if (my_level == 2)
          detection_window = 0.1;
        if (my_level == 3)
          detection_window = 0.5;
        if ((math.abs(distance_covered + width_obs2[i]) <= detection_window) && done_obs2[i] == 0) {
          done_obs2[i] = 1;
            var temp = math.floor(Rotation_obs2[i]/(2*math.PI));
            var net_rotation = Rotation_obs2[i] - temp*(2*math.PI);
            // console.log (net_rotation);
            // console.log(net_rotation);
            if (((net_rotation <= (12*math.PI/180)) && (net_rotation >= -(12*math.PI/180))) 
                  || ((net_rotation <= (192*math.PI/180)) && (net_rotation >= (168*math.PI/180))) || net_rotation >= (350*math.PI/180)) {
              collision_detected = 1;
              alert("Game Over");
          }
          if (collision_detected == 0) {
                if (my_level == 1)
                  score += 10;
                if (my_level == 2)
                  score += 30;
                if (my_level == 3)
                  score += 50;
            }
        }

    }
    
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function initBuffers(gl,num, z) {

  const positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
      radius*(math.cos(math.PI/8)), radius*(math.sin(math.PI/8)), z,
      radius*(math.cos(math.PI/8)), radius*(math.sin(math.PI/8)), z - block_size,
      radius*(math.cos(3*math.PI/8)), radius*(math.sin(3*math.PI/8)), z,
      radius*(math.cos(3*math.PI/8)), radius*(math.sin(3*math.PI/8)), z - block_size,

      radius*(math.cos(3*math.PI/8)), radius*(math.sin(3*math.PI/8)), z,
      radius*(math.cos(3*math.PI/8)), radius*(math.sin(3*math.PI/8)), z - block_size,
      radius*(math.cos(5*math.PI/8)), radius*(math.sin(5*math.PI/8)), z,
      radius*(math.cos(5*math.PI/8)), radius*(math.sin(5*math.PI/8)), z - block_size,

      radius*(math.cos(5*math.PI/8)), radius*(math.sin(5*math.PI/8)), z,
      radius*(math.cos(5*math.PI/8)), radius*(math.sin(5*math.PI/8)), z - block_size,
      radius*(math.cos(7*math.PI/8)), radius*(math.sin(7*math.PI/8)), z,
      radius*(math.cos(7*math.PI/8)), radius*(math.sin(7*math.PI/8)), z - block_size,

      radius*(math.cos(7*math.PI/8)), radius*(math.sin(7*math.PI/8)), z,
      radius*(math.cos(7*math.PI/8)), radius*(math.sin(7*math.PI/8)), z - block_size,
      radius*(math.cos(9*math.PI/8)), radius*(math.sin(9*math.PI/8)), z,
      radius*(math.cos(9*math.PI/8)), radius*(math.sin(9*math.PI/8)), z - block_size,

      radius*(math.cos(9*math.PI/8)), radius*(math.sin(9*math.PI/8)), z,
      radius*(math.cos(9*math.PI/8)), radius*(math.sin(9*math.PI/8)), z - block_size,
      radius*(math.cos(11*math.PI/8)), radius*(math.sin(11*math.PI/8)), z,
      radius*(math.cos(11*math.PI/8)), radius*(math.sin(11*math.PI/8)), z - block_size,

      radius*(math.cos(11*math.PI/8)), radius*(math.sin(11*math.PI/8)), z,
      radius*(math.cos(11*math.PI/8)), radius*(math.sin(11*math.PI/8)), z - block_size,
      radius*(math.cos(13*math.PI/8)), radius*(math.sin(13*math.PI/8)), z,
      radius*(math.cos(13*math.PI/8)), radius*(math.sin(13*math.PI/8)), z - block_size,

      radius*(math.cos(13*math.PI/8)), radius*(math.sin(13*math.PI/8)), z,
      radius*(math.cos(13*math.PI/8)), radius*(math.sin(13*math.PI/8)), z - block_size,
      radius*(math.cos(15*math.PI/8)), radius*(math.sin(15*math.PI/8)), z,
      radius*(math.cos(15*math.PI/8)), radius*(math.sin(15*math.PI/8)), z - block_size,

      radius*(math.cos(15*math.PI/8)), radius*(math.sin(15*math.PI/8)), z,
      radius*(math.cos(15*math.PI/8)), radius*(math.sin(15*math.PI/8)), z - block_size,
      radius*(math.cos(math.PI/8)), radius*(math.sin(math.PI/8)), z,
      radius*(math.cos(math.PI/8)), radius*(math.sin(math.PI/8)), z - block_size,    
    
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);
  const faceColors = [
    [1.0,  1.0,  1.0,  1.0],    // Front face: white
    [1.0,  0.0,  0.0,  1.0],    // Back face: red
    [0.0,  1.0,  0.0,  1.0],    // Top face: green
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  0.0,  0.0,  1.0],    // Top face: green
  ];

  var colors = [];
      var count=0;
      for (var j = num; count != faceColors.length; j=(j+1)%faceColors.length) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
        count++;
    }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [
      1.0,  1.0,  0.0,
      1.0,  1.0,  0.0,
      1.0,  1.0,  0.0,
      1.0,  1.0,  0.0,
      
      0.0,  1.0,  0.0,
      0.0,  1.0,  0.0,
      0.0,  1.0,  0.0,
      0.0,  1.0,  0.0,

      -1.0, 1.0,  0.0,
      -1.0, 1.0,  0.0,
      -1.0, 1.0,  0.0,
      -1.0, 1.0,  0.0,
      
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
     -1.0,  0.0,  0.0,

     -1.0,  -1.0, 0.0,
     -1.0,  -1.0, 0.0,
     -1.0,  -1.0, 0.0,
     -1.0,  -1.0, 0.0,
     
     0.0,  -1.0,  0.0,
     0.0,  -1.0,  0.0,
     0.0,  -1.0,  0.0,
     0.0,  -1.0,  0.0,


    1.0,  -1.0,  0.0,
    1.0,  -1.0,  0.0,
    1.0,  -1.0,  0.0,
    1.0,  -1.0,  0.0,


    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                gl.STATIC_DRAW);



  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
      0,  1,  2,     1, 2, 3,
      4,  5,  6,     5, 6, 7,
      8,  9, 10,     9, 10, 11,
      12, 13 ,14,    13, 14, 15,
      16, 17, 18,    17, 18, 19,
      20, 21, 22,    21, 22, 23,
      24, 25, 26,    25, 26, 27,
      28, 29, 30,    29, 30, 31,
    ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    normal: normalBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

function drawScene(gl, programInfo, buffers, texture, deltaTime) {
 
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

{
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
{
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }
  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix);
  {
    const vertexCount = 48;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
     gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);


    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  gl.flush();
  // Update the rotation for the next draw

}

function drawScene_color(gl, programInfo, buffers, deltaTime) {
 
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }
 {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset);
  gl.enableVertexAttribArray(
    programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
  {
    const vertexCount = 48;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
  
  // Bind the texture to texture unit 0
  

    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  gl.flush();
  // Update the rotation for the next draw

}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

