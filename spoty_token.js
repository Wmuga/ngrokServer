const req = require('request')
const http = require('http')
let opn = require('opn')

class SpotifyToken{
  constructor(id,secret){
    this.id = id
    this.secret = secret
  }
  authorize(){
    let app_code
    let http_server = http.createServer((req,res)=>{
      res.setHeader('Access-Control-Allow-Origin','*')
      let url_object = new URL(`http://localhost:4100${req.url}`)
      app_code = url_object.searchParams.get('code')
      switch (url_object.pathname){
          case '/callback':
              res.writeHead(200)
              res.end("<html><head></head><body><p>This page will close automatically</p><script>setTimeout(()=>{window.close()},500)</script></body></html>")
              break;
          default:
              res.writeHead(404)
              res.end()
              break;
      }
    })
    http_server.listen(4100,'localhost',()=>{
        let scopes = 'user-modify-playback-state user-read-playback-state'
        opn(encodeURI(`https://accounts.spotify.com/authorize?client_id=${this.id}&response_type=code&redirect_uri=http://localhost:4100/callback&scope=${scopes}`))
    })
    setTimeout(()=>{
      this.app_code = app_code
    },2000)
    
  }

  encode_id_secret(){
    return Buffer.from(`${this.id}:${this.secret}`).toString('base64')
  }
  get_simple_header(){
    return {
        "Content-Type":'application/x-www-form-urlencoded',
        "Authorization": `Basic ${this.encode_id_secret()}`
    }
  }
  get_token(){
    return requestJson('POST',`https://accounts.spotify.com/api/token?grant_type=authorization_code&code=${this.app_code}&redirect_uri=http://localhost:4100/callback`,
    this.get_simple_header())
  }

  get_bearer_header(){
    let token = this.access_token_data['access_token']
    return {"Authorization": `Bearer ${token}`}
  }

  async set_token_updater(cancellation){
    this.authorize()
    while(!this.app_code) await new Promise(resolve => setTimeout(resolve,100))
    console.log('Got app code')
    this.access_token_data = await this.get_token()
    console.log('Got token')
    this.refresh_token = this.access_token_data['refresh_token']
    this.app_code = ''
    let cont = true
    while(cont){
        cancellation?.on('cancel',()=>{
            console.log('Cancelled')
            cont = false
        }) 
        this.access_token_data = await this.refresh_access_token(this.access_token_data['expires_in'],this.refresh_token)
    }
  }
  refresh_access_token(expires_in,token){
    return new Promise(async function(resolve){
        await new Promise(r => setTimeout(r,expires_in*1000))
        console.log('Refresh token')
        resolve(await requestJson('POST',`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${token}`,
        get_simple_header()))
    })
  }
}

module.exports.SpotifyToken = SpotifyToken

function request(_method,_url,_headers){
    let req_options = {
        method:_method,
        url:_url,
    }
    if (_headers) req_options.headers = _headers;
    return new Promise(resolve =>{
        req(req_options,async function(error, response,body){
            if (error) {
                console.log(error);
                body = await request(_method,_url,_headers);
                resolve(body);
            }
            resolve(body)
        })
    });
}

function requestJson(_method,_url,_headers){
    let req_options = {
        method:_method,
        url:_url,
    }
    if (_headers) req_options.headers = _headers;
    return new Promise(resolve =>{
        req(req_options,async function(error, response,body){
            if (error) {
                console.log(error);
                body = await request(_method,_url,_headers);
                resolve(body);
            }
            resolve(JSON.parse(body))
        })
    });
}
