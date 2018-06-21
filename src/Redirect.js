var CustomError = require('twiz-client-utils').CustomError;
   
   function Redirect (args){     // used to redirect user to twitter interstitals page (authorize leg)
    
      this.newWindow     = args.newWindow;      // new tap / popup features
      this.url           = args.redirectionUrl; // url whre twitter will direct user after authorization
      this.callback_func = args.callback_func;  // callback if there is no promise
      this.reject        = args.reject

      this.requestToken;    // data from request token step   
      
      this.throwAsyncError = function(error){
           if(Promise) return this.reject(error);  // if we have promise use reject for async Errors
           
           throw error;                            // otherways just throw it
      }
      
      CustomError.call(this); // add CustomError feature
      this.addCustomErrors({
         noCallbackFunc: 'You must specify a callback function',
         callbackURLnotConfirmed: "Redirection(callback) url you specified wasn't confirmed by Twitter"
      })

    
   }


   Redirect.prototype.redirection = function(resolve, error, sentData){ // Callback function for 2nd step
      
      //console.log("From twitter request_token: ", sentData);
      //console.log('sentData type: ',typeof sentData);
      //console.log('error :', error);

      if(error || !sentData.oauth_token){ // on error or on valid data deliver it to user 
      
         this.deliverData(resolve, {'error': error, 'data': sentData});
         return;
      }
 
      this.requestToken = sentData;      // set requestToken data
      this.confirmCallback(sentData);    // confirm that twitter accepted user's redirection(callback) url
      this.saveRequestToken(window.localStorage, sentData.oauth_token); 
      this.redirect(resolve)             // redirect user to twitter for authorization 
   };
   
   Redirect.prototype.deliverData = function(resolve, obj){ // delivers data to user by promise or
                                                                        // by callback function
     // console.log('in deliverData, obj:', obj);
      if(resolve){ //console.log('has promise')
         resolve(obj);
         return;
      }
      
      if(this.callback_func) {             // when no promise is avalable invoke callback
         this.callback_func(obj);
         return;
      }
      this.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or
                                                                // callback present
   }

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
      var url = this.url + "?" + 'oauth_token=' + this.requestToken.oauth_token; 
                                                                                 // assemble url for second leg

      if(!this.newWindow){ // single page app
         this.SPA(resolve, url); // redirects current window to url
         return;

      }
                         
      this.site(resolve, url); // site 
      
   };

   Redirect.prototype.SPA = function(resolve, url){   // logic for Single Page Apps
      function redirectCurrentWindow(){ window.location = url; }// redirects window we are currently in (no popUp)
      var obj = { 'redirection': true } // since there is no newWindow reference, just indicate redirection
      
      if(resolve){                   // resolve promise
         resolve(obj);               // resolve with obj
         Promise.resolve()             
         .then(function(){          // redirect asap
            redirectCurrentWindow() 
         })
         return;
      }

      if(this.callback_func){     // when no promise call user callback func
         this.callback_func(obj);                                   // run callback with token
         setTimeout(function(){ redirectCurrentWindow() }, 0) ;  // redirect asap
         return; 
      }

      
      this.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or callback present
   }

   Redirect.prototype.site = function(resolve, url){ 
      var opened = this.openWindow();       // open new window/popup and save its reference
      opened.location = url;                // change location (redirect)
      
      this.deliverData(resolve, { 'window': opened })       // newWindow reference
   
   }

   Redirect.prototype.openWindow = function(){ // opens pop-up and puts in under current window
      //console.log("==== POP-UP =====");
      this.newWindow.window = window.open('', this.newWindow.name, this.newWindow.features);
      // console.log("this.newWindow: ", this.newWindow.window ); 

      return this.newWindow.window;
   }

   module.exports = Redirect;

