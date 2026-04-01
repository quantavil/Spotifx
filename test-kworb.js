fetch('https://kworb.net/spotify/country/in_weekly.html')
  .then(res => res.text())
  .then(html => {
    const lines = html.split('\n');
    for(let line of lines) {
      if(line.includes('<td class="text"><a href=')) {
        console.log(line);
        break; // just need one matching line
      }
    }
  });
