
const cvs = document.getElementById('cvs');
cvs.width = 256;
cvs.height = 240;
const ctx = cvs.getContext('2d');

window.addEventListener('load', init);
window.addEventListener("message", event =>{
  const message = event.data;
  if (message.imageData)
  {
    let imgData = ctx.createImageData(256, 240);
    for (var i=0;i<imgData.data.length;i++){
      imgData.data[i]=message.imageData[i];
    }
    ctx.putImageData(imgData,0,0);
  }
});

function init(){
  // init
}
