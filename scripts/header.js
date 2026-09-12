fetch("/header.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
  });
fetch("/footer.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
    document.dispatchEvent(new Event('footerLoaded'));
  });
 
const target = document.querySelector('main'); 

document.addEventListener('mousemove', (e) => {
  const rect = target.getBoundingClientRect();
  
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  document.documentElement.style.setProperty('--x', `${x}px`);
  document.documentElement.style.setProperty('--y', `${y}px`);
});
