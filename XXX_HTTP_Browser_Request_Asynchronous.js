

/*

Delivery:
	- element (target = element or element ID)
	- text (target = callback)
	- json (target = callback) (Kind of like remoting, get structure from the server)
	- xml (target = callback)

// History manager (RSH)

Doesn't work cross-(sub)-domain!

*/

var XXX_HTTP_Browser_Request_Asynchronous =
{
	CLASS_NAME: 'XXX_HTTP_Browser_Request_Asynchronous',
	
	isSupported: false,
	isCORSSupported: false,
	
	requestQueue: [],
	handlers: [],
	
	// Handler
	
		createHandler: function (reservedForRequestIndex, crossDomain)
		{
			var handler = false;
			
			if (reservedForRequestIndex)
			{
				reservedForRequestIndex = -1;	
			}
			
			var nativeAsynchronousRequestHandler = XXX_HTTP_Browser_NativeHelpers.nativeAsynchronousRequestHandler.get(crossDomain);
			
			if (nativeAsynchronousRequestHandler !== false)
			{
				var tempHandler =
				{
					state: 'free',
					reservedForRequestIndex: reservedForRequestIndex,
					nativeAsynchronousRequestHandler: nativeAsynchronousRequestHandler
				};
				
				handler = this.handlers.push(tempHandler) - 1;
			}
			
			return handler;
		},
		
		resetHandler: function (handlerIndex)
		{
			if (this.handlers[handlerIndex])
			{
				XXX_HTTP_Browser_NativeHelpers.nativeAsynchronousRequestHandler.cancelRequest(this.handlers[handlerIndex].nativeAsynchronousRequestHandler);
				
				// Cancel might trigger a handleFailedResponse event.
				if (this.handlers[handlerIndex])
				{
					this.handlers[handlerIndex].state = 'free';
					this.handlers[handlerIndex].reservedForRequestIndex = -1;
				}
				else
				{
					this.deleteHandler(handlerIndex);
				}
			}	
		},	
		
		deleteHandler: function (handlerIndex)
		{
			if (this.handlers[handlerIndex])
			{
				XXX_HTTP_Browser_NativeHelpers.nativeAsynchronousRequestHandler.cancelRequest(this.handlers[handlerIndex].nativeAsynchronousRequestHandler);
				
				this.handlers[handlerIndex].nativeAsynchronousRequestHandler = null;
				
				delete this.handlers[handlerIndex].nativeAsynchronousRequestHandler;
				
				// Can't use splice because the index is the ID, otherwise make an associative array like animation with ID's
				delete this.handlers[handlerIndex];
			}
		},
			
	// Request / Response
	
		startRequest: function (handlerIndex, requestIndex)
		{		
			if (this.handlers[handlerIndex] && this.requestQueue[requestIndex])
			{
				XXX_JS.errorNotification(1, 'Started request with requestID: "' + this.requestQueue[requestIndex].requestID + '"', this.className);
				
				// Set request to in process
				this.requestQueue[requestIndex].state = 'processing';
				this.requestQueue[requestIndex].handlerIndex = handlerIndex;
				
				// Set handler to in process
				this.handlers[handlerIndex].state = 'processing';
				
				var nativeAsynchronousRequestHandler = this.handlers[handlerIndex].nativeAsynchronousRequestHandler;
				
				var request = this.requestQueue[requestIndex];
												
				var XXX_requestIndex = requestIndex;
				var XXX_handlerIndex = handlerIndex;
				
				var XXX_completedCallback = function () { XXX_HTTP_Browser_Request_Asynchronous.handleCompletedResponse(XXX_handlerIndex, XXX_requestIndex); };		
				var XXX_failedCallback = function () { XXX_HTTP_Browser_Request_Asynchronous.handleFailedResponse(XXX_handlerIndex, XXX_requestIndex); };
				
				XXX_HTTP_Browser_NativeHelpers.nativeAsynchronousRequestHandler.sendRequest(nativeAsynchronousRequestHandler, request.uri, request.data, XXX_completedCallback, XXX_failedCallback, request.transportMethod, request.cacheable, request.crossDomain);
			}
		},
		
		handleCompletedResponse: function (handlerIndex, requestIndex)
		{			
			if (this.handlers[handlerIndex] && this.requestQueue[requestIndex])
			{			
				var response = XXX_HTTP_Browser_NativeHelpers.nativeAsynchronousRequestHandler.getResponse(this.handlers[handlerIndex].nativeAsynchronousRequestHandler);
				
				if (response && response.text != '')
				{		
					if (XXX_JS.debug)
					{
						XXX_JS.errorNotification(1, 'Completed response from request with requestID: "' + this.requestQueue[requestIndex].requestID + '"', this.CLASS_NAME);
					}
					
					switch (this.requestQueue[requestIndex].delivery)
					{
						case 'text':
							(this.requestQueue[requestIndex].target)(response.text);
							break;
						case 'json':
							if (this.handlers[handlerIndex].nativeAsynchronousRequestHandler.type == 'include')
							{
								(this.requestQueue[requestIndex].target)(response.text);
							}
							else
							{
								(this.requestQueue[requestIndex].target)((response.text ? XXX_String_JSON.decode(response.text) : ''));
							}
							break;
						case 'xml':
							(this.requestQueue[requestIndex].target)(response.xml);
							break;
						case 'element':
							XXX_DOM.setInner(this.requestQueue[requestIndex].target, response.text);
							break;
					}
					
					this.deleteRequest(requestIndex);
					
					if (this.handlers[handlerIndex].nativeAsynchronousRequestHandler.type == 'include')
					{
						this.deleteHandler(handlerIndex);
					}
					else
					{
						// Reset handler back to available
						this.resetHandler(handlerIndex);
					}
					
					this.processQueue();
				}
				// Aborted response (Cross-domain problem etc.)
				else
				{
					this.handleFailedResponse(handlerIndex, requestIndex);
				}
			}
		},
		
		handleFailedResponse: function (handlerIndex, requestIndex)
		{
			if (XXX_JS.debug)
			{
				XXX_JS.errorNotification(1, 'Failed response from request with requestID: "' + this.requestQueue[requestIndex].requestID + '"', this.CLASS_NAME);
			}
			
			if (this.requestQueue[requestIndex].failedCallback)
			{
				this.requestQueue[requestIndex].failedCallback();
			}
			
			this.deleteRequest(requestIndex);
			
			this.deleteHandler(handlerIndex);
			
			this.processQueue();
		},
		
		deleteRequest: function (requestIndex)
		{
			// Can't use splice because the index is the ID, otherwise make an associative array like animation with ID's
			delete this.requestQueue[requestIndex];
		},
	
	// Other
		
		processQueue: function ()
		{
			var handlerTotal = 0;
			
			for (var k = 0, kEnd = XXX_Array.getFirstLevelItemTotal(this.handlers); k < kEnd; ++k)
			{
				if (this.handlers[k])
				{
					++handlerTotal;
				}
			}
						
			// If no handlers exist yet, create one
			if (handlerTotal === 0)
			{
				var crossDomain = false;
				
				for (var j = 0, jEnd = XXX_Array.getFirstLevelItemTotal(this.requestQueue); j < jEnd; ++j)
				{
					var request = this.requestQueue[j];
							
					// Beware of deleted indexes
					if (request)
					{
						if (request.crossDomain)
						{
							crossDomain = true;
							
							break;
						}
					}
				}
				
				this.createHandler(-1, crossDomain);
			}
			
			// Check for free handlers to process the queue
			for (var i = 0, iEnd = XXX_Array.getFirstLevelItemTotal(this.handlers); i < iEnd; ++i)
			{
				var handler = this.handlers[i];
				
				// Beware of deleted indexes...
				if (handler)
				{
					// Check if state is free
					if (handler.state === 'free')
					{
						var foundRequestToProcess = false;
						
						// Check for unprocessed requests in the queue
						for (var j = 0, jEnd = XXX_Array.getFirstLevelItemTotal(this.requestQueue); j < jEnd; ++j)
						{
							var request = this.requestQueue[j];
							
							// Beware of deleted indexes
							if (request)
							{
								XXX_JS.errorNotification(0, 'Has cors support ' + (handler.nativeAsynchronousRequestHandler.corsSupport ? 'true' : 'false'));
								
								// Check if status is unprocessed
								if (request.state === 'queued' && (!request.crossDomain || (request.crossDomain && handler.nativeAsynchronousRequestHandler.corsSupport)))
								{
									this.startRequest(i, j);
									
									foundRequestToProcess = true;
								}
							}
						}
						
						// If there are no unprocessed requests there is no need to keep this handler...
						if (!foundRequestToProcess)
						{
							// TODO Maybe leave it intact for a future request
							this.deleteHandler(i);
						}
					}
				}
			}
		},
		
		getReservedHandlerIndexForRequestIndex: function (requestIndex)
		{
			var freeHandlerIndex = false;
				
			// Check for free handlers to process the request
			for (var i = 0, iEnd = XXX_Array.getFirstLevelItemTotal(this.handlers); i < iEnd; ++i)
			{
				var handler = this.handlers[i];
				
				// Beware of deleted indexes...
				if (handler)
				{
					// Check if status is free
					if (handler.state === 'free' && (!this.requestQueue[requestIndex].crossDomain || (this.requestQueue[requestIndex].crossDomain && handler.nativeAsynchronousRequestHandler.corsSupport)))
					{
						freeHandlerIndex = i;
						
						// Claim it "private' for this request
						this.handlers[i].reservedForRequestIndex = requestIndex;
					}
				}
			}
			
			var handlerIndex = freeHandlerIndex;
			
			if (handlerIndex === false)
			{			
				handlerIndex = this.createHandler(requestIndex, this.requestQueue[requestIndex].crossDomain);
			}
			
			return handlerIndex;
		},
		
		reset: function ()
		{
			for (var i = 0, iEnd = XXX_Array.getFirstLevelItemTotal(this.handlers); i < iEnd; ++i)
			{
				this.deleteHandler(i);
			}
			
			this.requestQueue = [];
			
			this.handlers = [];
		},
			
	// Queue (Use these externally)
	
		queueRequest: function (requestID, uri, data, target, delivery, skipQueue, transportMethod, cacheable, failedCallback, crossDomain)
		{
			delivery = XXX_Default.toOption(delivery, ['element', 'text', 'json', 'xml'], 'text');
			skipQueue = skipQueue ? true : false;
			transportMethod = XXX_Default.toOption(transportMethod, ['uri', 'body'], 'body');
			cacheable = cacheable ? true : false;
			crossDomain = crossDomain ? true : false;
			
			// Make sure no previous requests with the same ID are running...
			this.cancelRequest(requestID);
			
			var request = 
			{
				requestID: requestID,
				handlerIndex: -1,
				state: 'queued',
				uri: uri,
				data: data,
				target: target,
				transportMethod: transportMethod,
				delivery: delivery,
				cacheable: cacheable,
				failedCallback: failedCallback,
				crossDomain: crossDomain
			};
		
			var requestIndex = this.requestQueue.push(request) - 1;
						
			// Assign a "private" handler to the request
			if (skipQueue)
			{
				var handlerIndex = this.getReservedHandlerIndexForRequestIndex(requestIndex);
				
				this.startRequest(handlerIndex, requestIndex);
			}
			// Just wait in line....
			else
			{
				this.processQueue();
			}
		},
		
		forceRequest: function (requestID, uri, data, target, delivery, transportMethod, cacheable, failedCallback)
		{
			return this.queueRequest(requestID, uri, data, target, delivery, true, transportMethod, cacheable, failedCallback);
		},
		
		cancelRequest: function (requestID)
		{
			var found = false;
			
			if (XXX_Array.getFirstLevelItemTotal(this.requestQueue) > 0)
			{			
				for (var i = 0, iEnd = XXX_Array.getFirstLevelItemTotal(this.requestQueue); i < iEnd; ++i)
				{
					var request = this.requestQueue[i];	
					
					// Beware of deleted indexes...
					if (request)
					{
						if (request.requestID == requestID)
						{
							if (XXX_JS.debug)
							{
								XXX_JS.errorNotification(1, 'Cancelled request with requestID: "' + requestID + '"', this.CLASS_NAME);
							}
														
							if (request.handlerIndex !== -1)
							{
								if (this.handlers[request.handlerIndex])
								{
									if (this.handlers[request.handlerIndex].nativeAsynchronousRequestHandler.type == 'include')
									{
										this.deleteHandler(request.handlerIndex);
									}
									else
									{
										this.resetHandler(request.handlerIndex);
									}
								}
							}
							
							this.deleteRequest(i);
							
							found = true;
							// break;
						}
					}
				}
			}
			
			if (!found)
			{
				if (XXX_JS.debug)
				{
					XXX_JS.errorNotification(1, 'Did not find any requests to cancel with requestID: "' + requestID + '"', this.CLASS_NAME);
				}
			}
			
			return found;
		},
	
	// Support
		
		checkSupport: function ()
		{
			var result = false;
			
			if (this.isSupported)
			{
				result = true;
			}
			else
			{
				var handler = this.createHandler();
				
				if (handler !== false)
				{
					result = true;	
					
					var handler = this.createHandler(-1, true);
					
					if (handler !== false)
					{
						this.isCORSSupported = true;
					}
				}
				
				this.isSupported = result;
			}
			
			return result;
		}
};