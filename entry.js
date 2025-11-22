async function runMain() {
  let includeJS = function(srcLoc) {
    return new Promise(res => {
      let loadReady = function() {
        console.log(srcLoc + " load ready!");
        res();
      };

      let js = document.createElement("script");
      js.src = srcLoc;
      js.onreadystatechange = loadReady();
      js.onload = loadReady();

      document.head.appendChild(js);
    });
  };

  await includeJS("./real-estate-sg-lib.js");
  await includeJS("./page.js");
}
