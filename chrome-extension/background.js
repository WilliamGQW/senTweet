chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'apiRequest') {
    fetch(request.url, {
      method: request.method || 'GET',
      headers: request.headers || {},
      body: JSON.stringify(request.body)
    })
      .then(response => response.json())
      .then(data => {
        console.log('API response:', data); 
        sendResponse(data);
      })
      .catch(error => {
        console.log('API error:', error); 
        sendResponse({ error });
      });
    return true; // Required for async sendResponse
  }
});