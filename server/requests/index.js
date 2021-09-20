function request(method,url,body,headers){
    let req = new XMLHttpRequest();
    req.open(method,url,false);
    if (headers)
        for (let key in headers){
            req.setRequestHeader(key,headers[key]);
        }
    req.send(body);
    return [req.responseText,req.getAllResponseHeaders()];
}

function setRequest(){
    let value = document.getElementById('request').value.split(' ')
    console.log(value)
    let method = value[0]
    let url = value[1]
    let body = document.getElementById('requestBody').value
    let headers = document.getElementById('requestHeaders').value
    if(headers.length>0) headers = JSON.parse(headers)
    let response = request(method,url,body,headers)
    document.getElementById('responseBody').innerHTML = response[0]
    document.getElementById('responseHeaders').innerHTML = response[1]
}