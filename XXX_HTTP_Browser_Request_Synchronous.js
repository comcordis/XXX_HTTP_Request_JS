
var XXX_HTTP_Browser_Request_Synchronous =
{
	sendRequest: function (uri, variables, transportMethod)
	{
		transportMethod = XXX_Default.toOption(transportMethod, ['uri', 'body'], 'body');
		
		switch (transportMethod)
		{
			case 'uri':
				if (!XXX_Type.isString(variables))
				{
					variables = XXX_HTTP_Browser_NativeHelpers.composeParameterString(variables);
				}
				
				if (XXX_String.findFirstPosition(uri, '?') == -1)
				{
					uri += '?' + variables;
				}
				else
				{
					uri += '&' + variables;
				}
				
				XXX_HTTP_Browser_Page.goToURI(uri);
				break;
			case 'body':
				var nativeForm = XXX_DOM.createElementNode('form');
				XXX_DOM_NativeHelpers.nativeForm.setTransportMethod(nativeForm, 'body');
				XXX_DOM_NativeHelpers.nativeForm.setSubmitURI(nativeForm, uri);				
				XXX_DOM_NativeHelpers.nativeForm.setTransportFormat(nativeForm, 'application/x-www-form-urlencoded');
				
				var input;
				
				if (XXX_Array.getFirstLevelItemTotal(variables) > 0)
				{
					for (var i = 0, iEnd = XXX_Array.getFirstLevelItemTotal(variables); i < iEnd; ++i)
					{
						var variable = variables[i];
						
						if (XXX_Type.isAssociativeArray(variable))
						{
							var key = variable.key;
							var value = variable.value;
														
							if (XXX_Type.isNumericArray(value))
							{
								for (var j = 0, jEnd = XXX_Array.getFirstLevelItemTotal(value); j < jEnd; ++j)
								{
									var subValue = value[j];
									
									input = XXX_DOM.createElementNode('input');
			
										XXX_DOM.setAttribute(input, 'name', key +'[]');
										XXX_DOM.setAttribute(input, 'value', subValue);
										
									XXX_DOM.appendChildNode(nativeForm, input);
								}
							}
							else
							{								
								input = XXX_DOM.createElementNode('input');
		
									XXX_DOM.setAttribute(input, 'name', key);
									XXX_DOM.setAttribute(input, 'value', value);
									
								XXX_DOM.appendChildNode(nativeForm, input);
							}					
						}
					}
				}
				
				XXX_DOM.appendChildNode(document.body, nativeForm);
		
				nativeForm.submit();
				
				XXX_DOM.remove(nativeForm);
				break;
		}
	}
};