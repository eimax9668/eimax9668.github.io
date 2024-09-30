function show(url){
    fetch(`${url}`)
    .then(response => response.text())
    .then(data => {
      document.getElementById('blog').innerHTML = data;
    });
}