/**
* Author : Gérald Fenoy
*
* Copyright (c) 2015 GeoLabs SARL
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* This work was supported by a grant from the European Union's 7th Framework Programme (2007-2013)
* provided for the project PublicaMundi (GA no. 609608).
*/

// REQUIRES OpenLayers 3.7.0


define([
    'module', 'jquery', 'zoo', 'xml2json','ol'
], function(module, $, Zoo, X2JS,ol) {
    
    var zoo = new Zoo({
        url: module.config().url,
        delay: module.config().delay,
    });
    
    var mymodal = $('#myModal');
    
    

    function notify(text, type) {
        /*mynotify.notify({
            message: { text: text },
            type: type,
        }).show();*/
    }
    
    function showModal(title, body) {
        mymodal.find('.modal-body').text('');
        mymodal.find('.modal-body').append(body);
        mymodal.find('.modal-title').text(title);
        var options = {};
        mymodal.modal(options);
    }

    //OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;

    var map, SubwayStops, layer;
    var highlightOverlay,hover,multi;
    var requestUrl;
    var pop;

    var activatedServices={
	Mask: false,
	BufferMask: false,
	BufferRequest: false,
	BufferRequestAndMask: false
    };

    function onPopupClose(){
	if(pop)
	    map.removePopup(pop);
    }

    function createPopup(){
	var tmp=arguments[0].geometry.getCentroid();
	if(pop)
	    map.removePopup(pop);
	var attrs='<div style="color: #000;"><table>';
	for(var i in arguments[0].data)
	    if(i!="gml_id")
		attrs+="<tr><td width='100' style='font-weight: bold;'>"+i+"</td><td>"+arguments[0].data[i]+"</td></tr>";
	attrs+="</table></div>";
	pop=new OpenLayers.Popup.FramedCloud("Information",
					     arguments[0].geometry.getBounds().getCenterLonLat(),
					     new OpenLayers.Size(100,100),
					     "<h2>"+arguments[0].data.name+"</h2>"+attrs,
					     null, true,onPopupClose);
	map.addPopup(pop);
    }
    
    function unSelect(){
	if(pop)
	    map.removePopup(pop);
	//alert(arguments[0]);
    }

    function parseMapServerId(){
	try{
	    var sf=arguments[0].split(".");
	    return sf[0]+"."+sf[1].replace(/ /g,'');
	}catch(e){}
    }

    function toggleControl(element) {
	for(key in mapControls) {
	    var control = mapControls[key];
	    //alert ($(element).is('.ui-state-active'));
	    if(element.name == key && $(element).is('.ui-state-active')) {
		control.activate();
	    } else {
		control.deactivate();
	    }
	}
    }

    function restartDisplay(){
	var tmp=[highlightOverlay,hover,multi];
	for(i=0;i<tmp.length;i++)
	    if(tmp[i].getSource().getFeatures().length>=1)
		tmp[i].getSource().removeFeature(tmp[i].getSource().getFeatures()[0]);
	slist=$(".single-process:not(.ui-state-disabled)");
	for(var i=0;i<slist.length;i++)
	    slist[i].style.display='none';
	mlist=$(".multi-process:not(.ui-state-disabled)");
	for(var i=0;i<mlist.length;i++)
	    mlist[i].style.display='none';
    }

    function refreshDisplay(){
	elist=$(".single-process:not(.ui-state-disabled)");
	for(var i=0;i<elist.length;i++)
	    elist[i].style.display='block';
	if(hover.getSource().getFeatures().length>=1){
	    slist=$(".multi-process:not(.ui-state-disabled)");
	    for(var i=0;i<slist.length;i++)
		slist[i].style.display='block';
	}
    }

    function singleProcessing(aProcess) {
	//alert(requestUrl);
	if (highlightOverlay.getSource().getFeatures().length== 0)
	    return alert("No feature selected!");
	if(multi.getSource().getFeatures().length>=1)
  	    multi.getSource().removeFeature(multi.getSource().getFeatures()[0]);
	var started=true;
	var dep=hover;
	if(arguments.length>1){
	    dep=arguments[1];
	    started=false;
	}
	var xlink = requestUrl.replace(/application/g,"text").replace(/json/g,"xml");
	var inputs=[{"identifier":"InputPolygon","href":xlink,"mimeType":"text/xml"}];

	var isChain2=false;
	if(aProcess=="SimpleChain2"){
	    aProcess="BufferRequest";
	    isChain2=true;
	}

	/*for(var i in activatedServices)
	    if(aProcess==i){
		inputs[0].identifier="InputData";
		break;
	    }*/
	if (aProcess == 'Buffer' || aProcess == 'BufferPy') {
	    inputs.push({"identifier":"BufferDistance","value":"1","dataType":"integer"})
	}

	    
	console.log(inputs);
        zoo.execute({
            identifier: aProcess,
            dataInputs: inputs,
            dataOutputs: [{"identifier":"Result","mimeType":"application/json","type":"raw"}],
            type: 'POST',
            storeExecuteResponse: false,
            success: function(data) {
		if(hover.getSource().getFeatures().length>0)
		    hover.getSource().removeFeature(hover.getSource().getFeatures()[0]);
		notify('Execute succeded', 'success');
		var GeoJSON = new ol.format.GeoJSON();
		var features = GeoJSON.readFeatures(data,
						    {dataProjection: 'EPSG:4326',
						     featureProjection: 'EPSG:3857'});
		hover.getSource().addFeatures(features);
		refreshDisplay();
            },
            error: function(data) {
		notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
            }
        });
		
	if(isChain2 && started)
	    singleProcessing("BufferMask",hover_);
	
    }

    function multiProcessing(aProcess) {
	if (highlightOverlay.getSource().getFeatures().length == 0 || hover.getSource().getFeatures().length == 0)
	    return alert("Not enough feature created!");

	var xlink = requestUrl;
	var GeoJSON = new ol.format.GeoJSON();
	/*lfeatures=[];
	for(var i in hover.features){
	    lfeatures.push(hover.features[i].clone());
	    lfeatures[i].geometry=lfeatures[i].geometry.transform(mercator,wgs84);
	}*/
	//console.log(hover.getFeatures().item(0));
	//litem=hover.getFeatures().item(0).clone();
	//console.log(litem);
	
	val=GeoJSON.writeFeatures([hover.getSource().getFeatures()[0]],
				      {dataProjection: 'EPSG:4326',
				       featureProjection: 'EPSG:3857'});
	console.log(val);
	var inputs=[{"identifier":"InputEntity1","href":xlink,"mimeType":"text/xml"},
		   {"identifier":"InputEntity2","value":val,"mimeType":"application/json"}];

        zoo.execute({
            identifier: aProcess,
            dataInputs: inputs,
            dataOutputs: [{"identifier":"Result","mimeType":"application/json","type":"raw"}],
            type: 'POST',
            storeExecuteResponse: false,
            success: function(data) {
		if(multi.getSource().getFeatures().length>0)
		    multi.getSource().removeFeature(multi.getSource().getFeatures()[0]);
		notify('Execute succeded', 'success');
		console.log(data);
		var GeoJSON = new ol.format.GeoJSON();
		var features = GeoJSON.readFeatures(data,
						    {dataProjection: 'EPSG:4326',
						     featureProjection: 'EPSG:3857'});
		//console.log(features);
		/*if(multi.features)
		    multi.removeFeatures(multi.features);
		for(var j in features){
		    features[j].geometry=features[j].geometry.transform(wgs84,mercator);
		}
		multi.addFeatures(features);*/
		//if(features.getLength()>0)
		multi.getSource().addFeatures(features);
            },
            error: function(data) {
		notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
            }
        });

    }
    
    function activateService(){
	try{
	    $("#buttonBar").append('<a href="#" class="fg-button ui-state-default ui-text-only ui-corner-all single-process process" title="'+(arguments[0]!="SimpleChain2"?arguments[0]:"BufferRequestAndMask")+'" name="'+(arguments[0]!="SimpleChain2"?arguments[0]:"BufferRequestAndMask")+'" onclick="app.singleProcessing(\''+(arguments[0]!="SimpleChain2"?arguments[0]:"SimpleChain2")+'\');"> '+(arguments[0]!="SimpleChain2" && arguments[0]!="BufferMask" && arguments[0]!="BufferRequest"?arguments[0]:(arguments[0]!="BufferMask" && arguments[0]!="BufferRequest"?"Buffer Request and Mask":arguments[0]!="BufferRequest"?"Buffer Mask":"Buffer Request"))+' </a>');
	    
	    elist=$('.process');
	    for(var i=0;i<elist.length;i++){
		elist[i].style.display='none';
	    }
	    
	}catch(e){
	    alert(e);
	}
    }

    function applyMargins() {
        var leftToggler = $(".mini-submenu-left");
        if (leftToggler.is(":visible")) {
          $("#map .ol-zoom")
		.css("margin-left", 0)
		.removeClass("zoom-top-opened-sidebar")
		.addClass("zoom-top-collapsed");
        } else {
            $("#map .ol-zoom")
		.css("margin-left", $(".sidebar-left").width())
		.removeClass("zoom-top-opened-sidebar")
		.removeClass("zoom-top-collapsed");
        }
    }

    function isConstrained() {
        return $(".sidebar").width() == $(window).width();
    }

    function applyInitialUIState() {
        if (isConstrained()) {
            $(".sidebar-left .sidebar-body").fadeOut('slide');
            $('.mini-submenu-left').fadeIn();
        }
    }

    
    //
    var initialize = function() {
        self = this;        

     $(function(){

        $('.sidebar-left .slide-submenu').on('click',function() {
          var thisEl = $(this);
          thisEl.closest('.sidebar-body').fadeOut('slide',function(){
            $('.mini-submenu-left').fadeIn();
            applyMargins();
          });
        });

        $('.mini-submenu-left').on('click',function() {
          var thisEl = $(this);
          $('.sidebar-left .sidebar-body').toggle('slide');
          thisEl.hide();
          applyMargins();
        });

	var main_url="http://zoo-project.org:8080/geoserver/ows";
	var proxy="http://zoo-project.org/cgi-bin/proxy.cgi?url="
	var typename="topp:states";

	var wmsSource=new ol.source.ImageWMS({
	    url: main_url,
	    params: {'LAYERS': 'topp:states'},
	    serverType: 'geoserver'
	});
	var layers = [
	    new ol.layer.Tile({
		source: new ol.source.OSM()
	    }),
	    new ol.layer.Image({
		//extent: [-13884991, 2870341, -7455066, 6338219],
		source: wmsSource
	    })
	];
	map = new ol.Map({
	    layers: layers,
	    target: 'map',
	    view: new ol.View({
		center: [-10997148, 4569099],
		zoom: 3
	    })
	});
	
	var parser = new ol.format.GeoJSON();
	var style = new ol.style.Style({
	    fill: new ol.style.Fill({
		color: 'rgba(255,255,255,0.5)'
	    }),
	    stroke: new ol.style.Stroke({
		color: 'rgba(255,255,255,0.5)',
		width: 4
	    }),
	    text: new ol.style.Text({
		font: '12px Calibri,sans-serif',
		fill: new ol.style.Fill({
		    color: '#000'
		}),
		stroke: new ol.style.Stroke({
		    color: '#fff',
		    width: 3
		})
	    })
	});
	var style1 = new ol.style.Style({
	    fill: new ol.style.Fill({
		color: 'rgba(110,110,110,0.5)'
	    }),
	    stroke: new ol.style.Stroke({
		color: 'rgba(110,110,110,0.5)',
		width: 4
	    }),
	    text: new ol.style.Text({
		font: '12px Calibri,sans-serif',
		fill: new ol.style.Fill({
		    color: '#000'
		}),
		stroke: new ol.style.Stroke({
		    color: '#fff',
		    width: 3
		})
	    })
	});
	var style2 = new ol.style.Style({
	    fill: new ol.style.Fill({
		color: 'rgba(0,0,0,0.4)'
	    }),
	    stroke: new ol.style.Stroke({
		color: 'rgba(0,0,0,0.4)',
		width: 4
	    })
	});
	var styles = [style];
	var myproj=new ol.proj.Projection({
	    code: "EPSG:4326"
	});
	console.log(myproj);

	highlightOverlay = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	hover = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style1,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	multi = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style2,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	var toto=[highlightOverlay,hover,multi];
	for(i=0;i<toto.length;i++)
	    map.addLayer(toto[i]);
	/*highlightOverlay = new ol.FeatureOverlay({
	    style: style,
	    map: map
	});
	hover = new ol.FeatureOverlay({
	    style: style1,
	    map: map
	});
	multi = new ol.FeatureOverlay({
	    style: style2,
	    map: map
	});*/
	map.on('singleclick', function(evt) {
	    var view = map.getView();
	    var url = wmsSource.getGetFeatureInfoUrl(evt.coordinate,
					view.getResolution(), view.getProjection(),
					{'INFO_FORMAT': 'application/json'/*'INFO_FORMAT': 'application/vnd.ogc.gml'*/});
	    requestUrl=proxy+encodeURIComponent(url);
	    console.log(requestUrl);
	    $.ajax(requestUrl).then(function(response) {
		if(highlightOverlay.getSource().getFeatures().length>0)
		    highlightOverlay.getSource().removeFeature(highlightOverlay.getSource().getFeatures()[0]);
		console.log(response);
		var features = parser.readFeatures(response,
						   {dataProjection: 'EPSG:4326',
						    featureProjection: 'EPSG:3857'});
		console.log(features);
		highlightOverlay.getSource().addFeatures(features);
		console.log("ok");
		
		refreshDisplay();
	    });
	});

	zoo.getCapabilities({
	    type: 'POST',
	    success: function(data){
		restartDisplay();
		var processes=data["Capabilities"]["ProcessOfferings"]["Process"];
		for(var i in activatedServices){
		    for(var j=0;j<processes.length;j++)
			if(i==processes[j].Identifier){
			    activateService(i);
			    activatedServices[i]=true;
			    if(activatedServices["BufferRequest"] && activatedServices["BufferMask"] && !hasSimpleChain){
				activateService("SimpleChain2");
				activatedServices["BufferRequestAndMask"]=true;
				hasSimpleChain=true;
			    }
			    if(i=="BufferMask")
				if(activatedServices["BufferRequest"]){
				    activateService("SimpleChain2");
				    activatedServices["BufferRequestAndMask"]=true;
				}
			    break;
			}
		}
	    }
	});

        $(window).on("resize", applyMargins);


        applyInitialUIState();
        applyMargins();

    });

    }


    
    //
    var getCapabilities = function (params) {
	
        //var target = $(params.target);
        
        zoo.getCapabilities({
            type: params.method,
            success: function(data) {
                
                // Define some usefull functions for templating.
                data.setUpIndex = function() {
                    return ++window['INDEX']||(window['INDEX']=0);
                };
                data.getIndex = function() {
                    return window['INDEX'];
                };
                data.resetIndex = function() {
                    window['INDEX']=null;
                    return;
                };
		console.log(data);
                // Render.
                var accordion = tpl_getCapabilities(data);
                //target.append(accordion);
                showModal("test", accordion)

                // Details button
                $('.showdetails').on('click', function(e) {
                    e.preventDefault();
                    console.log(this.dataset);

                    var $this = $(this);
                    var $collapse = $this.closest('.panel-body').find('.collapse');

                    zoo.describeProcess({
                        identifier: this.dataset.identifier,
                        success: function(data) {
                            var details =  tpl_describeProcess(data);

                            $collapse.hide();
                            $collapse.text('');
                            $collapse.append(details);
                            $collapse.show();
                        },
                        error: function(data) {
                            $collapse.hide();
                            $collapse.text('');
                            $collapse.append("ERROR");
                            $collapse.show();
                        }
                    });
                });
            },
            error: function(data) {
                notify('GetCapabilities failed', 'danger');
                //target.append('ERROR');
            }
        });
    };
    
    //
    var describeProcess = function(params) {
        //var target = $(params.target);

        zoo.describeProcess({
            identifier: params.identifier,
            type: params.method,
            success: function(data) {
                var details =  tpl_describeProcess(data);
                //target.text('');
                //target.append(details);
                
                var title = 'DescribeProcess '+params.identifier;
                showModal(title, details);
                
            },
            error: function(data) {
                notify('DescribeProcess failed', 'danger');
            }
        });
    };
    
    //
    var executeSynchrone = function(params) {
        var target = $(params.target);
        
        notify('Calling Execute synchrone ...', 'info');
        
        zoo.execute({
          identifier: params.identifier,
          dataInputs: params.inputs ? JSON.parse(params.inputs) : null,
          dataOutputs: params.outputs ? JSON.parse(params.outputs) : null,
          type: params.method,
          storeExecuteResponse: false,
          success: function(data) {
            notify('Execute succeded', 'success');
            var details =  tpl_executeResponse(data);
            target.text('');
            target.append(details);
            
            var output = data.ExecuteResponse.ProcessOutputs.Output;
            console.log('======== OUTPUT ========');
            console.log(output);
            if (output.hasOwnProperty('Data')) {
                console.log("FOUND DATA");
                if (output.Data.hasOwnProperty('ComplexData')) {
                    console.log("FOUND COMPLEX DATA");
                    if (output.Data.ComplexData.hasOwnProperty('__cdata')) {
                        console.log('FOUND CDATA');
                        showModal('Execute '+params.identifier, output.Data.ComplexData.__cdata);
                    }
                    else {
                        console.log('SHOWING COMPLEX DATA');
                        console.log(output.Data.ComplexData);
                        var _x2js = new X2JS({
                            arrayAccessFormPaths: [
                            'ProcessDescriptions.ProcessDescription.DataInputs.Input',
                            'ProcessDescriptions.ProcessDescription.DataInputs.Input.ComplexData.Supported.Format',
                            'ProcessDescriptions.ProcessDescription.ProcessOutputs.Output',
                            'ProcessDescriptions.ProcessDescription.ProcessOutputs.Output.ComplexOutput.Supported.Format',
                            'Capabilities.ServiceIdentification.Keywords'
                            ],   
                        });
                        showModal('Execute '+params.identifier, _x2js.json2xml_str(output.Data.ComplexData));
                    }
                }
            } else if (output.hasOwnProperty('Reference')) {
                console.log("FOUND REFERENCE");
                showModal('Execute '+params.identifier, output.Reference._href);
            }
          },
          error: function(data) {
            notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
          }
        });
        
    };
    
    //
    var executeAsynchrone = function(params) {
        var target = $(params.target);
        
        notify('Calling Execute asynchrone ...', 'info');
        
        zoo.execute({
          identifier: params.identifier,
          dataInputs: params.inputs ? JSON.parse(params.inputs) : null,
          dataOutputs: params.outputs ? JSON.parse(params.outputs) : null,
          type: params.method,
          storeExecuteResponse: true,
          status: true,
          
          success: function(data) {
            console.log("**** SUCCESS ****");
            notify('Execute succeded', 'success');
            var details =  tpl_executeResponse_async(data);
            target.text('');
            target.append(details);          
          },
          error: function(data) {
            notify('Execute failed', 'danger');
          }
        });
        
    }
    
    //
    var longProcessDemo = function(params) {
        
        var progress = $(params.target);
        progress.removeClass("progress-bar-success").addClass("progress-bar-info");

        zoo.execute({
          identifier: params.identifier,
          type: params.method,
          dataInputs: params.inputs ? JSON.parse(params.inputs) : null,
          dataOutputs: params.outputs ? JSON.parse(params.outputs) : null,
          storeExecuteResponse: true,
          status: true,
          success: function(data, launched) {
            console.log("**** SUCCESS ****");
            console.log(launched);
            notify("Execute asynchrone launched: "+launched.sid, 'info');

            // Polling status
            zoo.watch(launched.sid, {
                onPercentCompleted: function(data) {
                    console.log("**** PercentCompleted ****");
                    console.log(data);

                    progress.css('width', (data.percentCompleted)+'%');
                    progress.text(data.text+' : '+(data.percentCompleted)+'%');
                    
                },
                onProcessSucceeded: function(data) {
                    //console.log("**** ProcessSucceeded ****");
                    //console.log(data);
                    
                    progress.css('width', (100)+'%');
                    progress.text(data.text+' : '+(100)+'%');
                    progress.removeClass("progress-bar-info").addClass("progress-bar-success");
                    
                    // TODO: multiple output
                    if (data.result.ExecuteResponse.ProcessOutputs) {
                        var output = data.result.ExecuteResponse.ProcessOutputs.Output;
                        var id = output.Identifier.__text;
                        var text = output.Data.LiteralData.__text;
                        console.log(id+': '+text);
                        notify("Execute asynchrone "+id+': '+text, 'success');
                    }
                },
                onError: function(data) {
                    console.log("**** onError ****");
                    console.log(data);
                    notify("Execute asynchrone failed", 'danger');
                },        
            });
          },
          error: function(data) {
            console.log("**** ERROR ****");
            console.log(data);
            notify("Execute asynchrone failed", 'danger');
            
          },

        });
    };

    // Return public methods
    return {
        initialize: initialize,
        singleProcessing: singleProcessing,
        multiProcessing: multiProcessing,
        restartDisplay: restartDisplay,
        describeProcess: describeProcess,
        getCapabilities: getCapabilities,
        executeSynchrone: executeSynchrone,
        executeAsynchrone: executeAsynchrone,
        longProcessDemo: longProcessDemo
    };


});

