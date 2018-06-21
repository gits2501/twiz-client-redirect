var CustomError     = require('twiz-client-utils').CustomError;
var throwAsyncError = require('twiz-client-utils').throwAsyncError;
   
   function Redirect (args){     // used to redirect user to twitter interstitals page (authorize leg)
    
      this.newWindow     = args.newWindow;      // new tap / popup features
      this.url           = args.redirectionUrl; // url whre twitter will direct user after authorization
      this.callback_func = args.callback_func;  // callback if there is no promise
      this.reject        = args.reject
      this.requestToken;    // data from request token step   
      
      CustomError.call(this); // add CustomError feature
      this.addCustomErrors({
         noCallbackFunc: 'You must specify a callback function',
         callbackURLnotConfirmed: "Redirection(callback) url you specified wasn't confirmed by Twitter"
      })

    
   }


   Redirect.prototype.redirection = function(resolve, res){ // Callback function for 2nd step
      //  console.log(res);
      //console.log("From twitter request_token: ", res.data);
      //console.log('res.data type: ',typeof res.data);
      
      this.res = res;                        // save response reference
      //  console.log('|redirection res|:', res.data || 'no data')
      if(res.error || !res.data.oauth_token){ // on response error or on valid data deliver it to user 
         this.deliverData(resolve, res);
         return;
      }
      this.requestToken = res.data;      // set requestToken data
      this.confirmCallback(res.data);    // confirm that twitter accepted user's redirection(callback) url
      this.saveRequestToken(window.localStorage, res.data.oauth_token); // save token for url authorization 
      this.redirect(resolve)             // redirect user to twitter for authorization 
   };
   
   Redirect.prototype.deliverData = function(resolve, res){ // delivers data to user by promise or
                                                            // by callback function
      if(resolve){                                  // console.log('has promise')
         resolve(res);
         return;
      }

      if(this.callback_func) {             // when no promise is avalable invoke callback
         this.callback_func(res);
         return;
      }
   
      this.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or
                                                                // callback present
   }
  
   Redirect.prototype.throwAsyncError = throwAsyncError;        // promise (async) aware error throwing

   Redirect.prototype.confirmCallback = function (sent){ // makes sure that twitter is ok with redirection url
      // console.log('confirmed: +++ ',sent.oauth_callback_confirmed)
      if(sent.oauth_callback_confirmed !== "true")
         this.throwAsyncError(this.CustomError('callbackURLnotConfirmed'));
   }
 
   Redirect.prototype.saveRequestToken = function(storage, token){ // save token to storage
      storage.requestToken_ = null;                                // erase any previous tokens, note null is
                                                                   // actualy transformed to string "null"
      storage.requestToken_ =  token;                              // save token to storage
      //console.log('storage before: ', storage); 
   }

   Redirect.prototype.redirect = function(resolve){ // redirects user to twitter for authorization   
      //console.log('RESOLVE : ', resolve);
  
      var url = this.url + "?" + 'oauth_token=' + this.requestToken.oauth_token; // assemble url for second leg
      this.adjustResponse(this.res);                               // removes this.res.data                                                                               

      if(!this.newWindow){ // single page app
         this.SPA(resolve, url); // redirects current window to url
         return;

      }
                         
      this.site(resolve, url); // site 
      
   };
   
   Redirect.prototype.adjustResponse = function(res){ // tunes response so id doesnt have data when redirecting
      res.data = '';    // never send (request token) data to user 
   }

   Redirect.prototype.SPA = function(resolve, url){   // logic for Single Page Apps
      function redirectCurrentWindow(){ window.location = url; }// redirects window we are currently in (no popUp)
      
      this.res.redirection = true;  // since there is no newWindow reference indicate that redirection happens
     
      if(resolve){                   // resolve promise
         resolve(this.res);          // resolve with response object

         Promise.resolve()             
         .then(function(){           // redirect asap
            redirectCurrentWindow();
         })
         return;
      }

      if(this.callback_func){                                    // when no promise call user callback func
         this.callback_func(this.res);                           // run callback with token
         setTimeout(function(){ redirectCurrentWindow() }, 0) ;  // redirect asap
         return; 
      }

      this.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or callback present
   }

   Redirect.prototype.site = function(resolve, url){ 
      var opened = this.openWindow();       // open new window/popup and save its reference
      opened.location = url;                // change location (redirect)
      
      this.res.window = opened;             // newWindow reference
      this.deliverData(resolve, this.res);      
   
   }

   Redirect.prototype.openWindow = function(){ // opens pop-up and puts in current window reference
      this.newWindow.window = window.open('', this.newWindow.name, this.newWindow.features);
      return this.newWindow.window;
   }

   module.exports = Redirect;

