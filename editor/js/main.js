window.URL = window.URL || window.webkitURL;
window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

Number.prototype.format = function (){
  return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

var editor = new Editor();

var viewport = new Viewport( editor );
document.body.appendChild( viewport.dom );

var sidebar = new Sidebar( editor );
document.body.appendChild( sidebar.dom );

var menubar = new Menubar( editor );
document.body.appendChild( menubar.dom );

//

editor.setTheme( editor.config.getKey( 'theme' ) );

editor.storage.init( function () {

  editor.storage.get( function ( state ) {

    if ( isLoadingFromHash ) return;

    if ( state !== undefined ) {

      editor.fromJSON( state );

    }

    var selected = editor.config.getKey( 'selected' );

    if ( selected !== undefined ) {

      editor.selectByUuid( selected );

    }

  } );

  //

  var timeout;

  function saveState( scene ) {

    if ( editor.config.getKey( 'autosave' ) === false ) {

      return;

    }

    clearTimeout( timeout );

    timeout = setTimeout( function () {

      editor.signals.savingStarted.dispatch();

      timeout = setTimeout( function () {

        editor.storage.set( editor.toJSON() );

        editor.signals.savingFinished.dispatch();

      }, 100 );

    }, 1000 );

  };

  var signals = editor.signals;

  signals.geometryChanged.add( saveState );
  signals.objectAdded.add( saveState );
  signals.objectChanged.add( saveState );
  signals.objectRemoved.add( saveState );
  signals.materialChanged.add( saveState );
  signals.sceneBackgroundChanged.add( saveState );
  signals.sceneFogChanged.add( saveState );
  signals.sceneGraphChanged.add( saveState );
  signals.scriptChanged.add( saveState );
  signals.historyChanged.add( saveState );

} );

//

document.addEventListener( 'dragover', function ( event ) {

  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';

}, false );

document.addEventListener( 'drop', function ( event ) {

  event.preventDefault();

  editor.loader.loadFiles( event.dataTransfer.files );

}, false );

function onWindowResize( event ) {

  editor.signals.windowResize.dispatch();

}

window.addEventListener( 'resize', onWindowResize, false );

onWindowResize();

//

var isLoadingFromHash = false;
var hash = window.location.hash;

if ( hash.substr( 1, 5 ) === 'file=' ) {

  var file = hash.substr( 6 );

  if ( confirm( 'Any unsaved data will be lost. Are you sure?' ) ) {

    var loader = new THREE.FileLoader();
    loader.crossOrigin = '';
    loader.load( file, function ( text ) {

      editor.clear();
      editor.fromJSON( JSON.parse( text ) );

    } );

    isLoadingFromHash = true;

  }

}

// ServiceWorker

if ( 'serviceWorker' in navigator ) {

  try {

    navigator.serviceWorker.register( 'sw.js' );

  } catch ( error ) {

  }

}

function changeImage(files) {
  editor.scene.remove(image);
  Array.from(files).forEach(file => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
      let result = reader.result;
      loadTexture(result);
    }
  });
}

let image;
function loadTexture(imname) {
  // 画像のアレ
  let loader = new THREE.TextureLoader();
  let iw, ih;
  let texture = loader.load(imname, function(tex) {
    iw = tex.image.width/50;
    ih = tex.image.height/50;
    let imagegeometry = new THREE.PlaneBufferGeometry(iw, ih);
    let imagematerial = new THREE.MeshBasicMaterial( { map: texture } );
    image = new THREE.Mesh( imagegeometry, imagematerial );
    image.name = "画像";
    image.position.set(0, ih/2, 0);

    editor.scene.add(image);
  });
}

// HERE!!
{
  // Init image or not?
  //loadTexture("./images/image.jpg");

  // For legs
  var legsegmentCount = 2;
  var legheight = 2;
  var legsizing = {
    segmentHeight: legheight/legsegmentCount,
    segmentCount: legsegmentCount,
    height: legheight,
    halfHeight: legheight * 0.5
  };

  let legkansetu = ["足首", "ひざ", "足の付け根"];
  let leftleg = initBones(legsizing, "左足", legkansetu);
  leftleg.position.set(0.438, 1.3, 0);

  let rightleg = initBones(legsizing, "右足", legkansetu);
  rightleg.position.set(-0.438, 1.3, 0);

  // For torso
  var torsosegmentCount = 3;
  var torsoheight = 2;
  var torsosizing = {
    segmentHeight: torsoheight/torsosegmentCount,
    segmentCount: torsosegmentCount,
    height: torsoheight,
    halfHeight: torsoheight * 0.5
  };

  let koshikansetu = ["腰", "背骨1", "背骨2", "首"];
  let torso = initBones(torsosizing, "胴体", koshikansetu);
  torso.position.set(0, 3.233, 0);
  torso.scale.set(3, 1, 1);

  // For arms
  var armsegmentCount = 2;
  var armheight = 2;
  var armsizing = {
    segmentHeight: armheight/armsegmentCount,
    segmentCount: armsegmentCount,
    height: armheight,
    halfHeight: armheight * 0.5
  };
  let armkansetu = ["手首", "ひじ", "腕の付け根"];
  let leftarm = initBones(armsizing, "左腕", armkansetu);
  leftarm.position.set(-1.3, 3.8, 0);
  leftarm.rotation.set(0, 0, -20);

  let rightarm = initBones(armsizing, "右腕", armkansetu);
  rightarm.position.set(1.3, 3.8, 0);
  rightarm.rotation.set(0, 0, 20);

  let headgeometry = new THREE.SphereBufferGeometry(1, 20, 20);
  let headmaterial = new THREE.MeshPhongMaterial( {
    color: 0x156289,
    emissive: 0x072534,
    side: THREE.DoubleSide,
    flatShading: true
  } );
  let head = new THREE.Mesh(headgeometry, headmaterial);
  head.scale.set(0.8, 0.8, 0.8);
  head.position.set(0, 5.0, 0);
  head.name = "頭";

  const wrap = new THREE.Object3D();
  wrap.name = "人体";
  wrap.add(leftleg);
  wrap.add(rightleg);
  wrap.add(torso);
  wrap.add(leftarm);
  wrap.add(rightarm);
  wrap.add(head);
  editor.addObject(wrap);
}

function createGeometry(sizing, geomname) {

  var geometry = new THREE.CylinderBufferGeometry(
    0.2, // radiusTop
    0.2, // radiusBottom
    sizing.height, // height
    8, // radiusSegments
    sizing.segmentCount * 3, // heightSegments
    true // openEnded
  );
  geometry.name = geomname;

  var position = geometry.attributes.position;

  var vertex = new THREE.Vector3();

  var skinIndices = [];
  var skinWeights = [];

  for ( var i = 0; i < position.count; i ++ ) {

    vertex.fromBufferAttribute( position, i );

    var y = ( vertex.y + sizing.halfHeight );

    var skinIndex = Math.floor( y / sizing.segmentHeight );
    var skinWeight = ( y % sizing.segmentHeight ) / sizing.segmentHeight;

    skinIndices.push( skinIndex, skinIndex + 1, 0, 0 );
    skinWeights.push( 1 - skinWeight, skinWeight, 0, 0 );

  }

  geometry.addAttribute( 'skinIndex', new THREE.Uint16BufferAttribute( skinIndices, 4 ) );
  geometry.addAttribute( 'skinWeight', new THREE.Float32BufferAttribute( skinWeights, 4 ) );

  return geometry;

}

function createBones( sizing , kansetu) {

  bones = [];

  var prevBone = new THREE.Bone();
  prevBone.name = kansetu[0];
  bones.push( prevBone );
  prevBone.position.y = - sizing.halfHeight;

  for ( var i = 0; i < sizing.segmentCount; i ++ ) {

    var bone = new THREE.Bone();
    if (i < kansetu.length - 1)
      bone.name = kansetu[i+1];

    bone.position.y = sizing.segmentHeight;
    bones.push( bone );
    prevBone.add( bone );
    prevBone = bone;
  }

  return bones;
}

function createMesh( geometry, bones ) {

  var material = new THREE.MeshPhongMaterial( {
    skinning: true,
    color: 0x156289,
    emissive: 0x072534,
    side: THREE.DoubleSide,
    flatShading: true
  } );

  var mesh = new THREE.SkinnedMesh( geometry,	material );
  var skeleton = new THREE.Skeleton( bones );

  mesh.add( bones[ 0 ] );

  mesh.bind( skeleton );

  skeletonHelper = new THREE.SkeletonHelper( mesh );
  skeletonHelper.material.linewidth = 2;
  //editor.scene.add( skeletonHelper );

  return mesh;

}

function initBones(sizing, geomname, kansetu) {
  var geometry = createGeometry(sizing, geomname);
  var bones = createBones(sizing, kansetu);
  mesh = createMesh( geometry, bones );

  mesh.scale.multiplyScalar( 1 );
  return mesh;
}
