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

require(['bootstrap', 'notify']);

define([
    'module', 'jquery', 'zoo', 'xml2json','ol', 'hgn!tpl/describe_process_form'
], function(module, $, Zoo, X2JS,ol,tpl_describeProcess) {

    var zoo = new Zoo({
        url: module.config().url,
        delay: module.config().delay,
    });

    var currentLID=0;
    var mymodal = $('#myModal');
    var mynotify = $('.top-right');
    //var mapUrl = "http://zoo.dev.publicamundi.eu/cgi-bin/mapserv?map=/var/www/data/project_Untitled_0_test.map";
    var mapUrl = "http://123.242.166.129:8080/geoserver/ows";
    var map;


    function notify(text, type) {
        mynotify.notify({
            message: { text: text },
            type: type,
        }).show();
    }

    var initialize = function() {

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

	console.log('step 0');
	 //3.47201366356192 43.2764995969651 3.81130212712671 43.5081449510672

map = new ol.Map({
	    layers: new ol.Collection(),
	    target: 'map',
	    view: new ol.View({
		center: ol.proj.transform([0.00,0.00], 'EPSG:4326', 'EPSG:3857'),
		zoom: 2
	    })
	});


	var style1 = new ol.style.Style({
            image: new ol.style.Circle({
		radius: 5,
		fill: new ol.style.Fill({
		    color: 'rgba(254,252,234,1)'
		}),
		stroke: new ol.style.Stroke({
		    color: 'rgba(102,62,5,1)'
		})
	    })
	});

  layerOSM=new ol.layer.Tile({
    opacity: 0.7,
    source: new ol.source.OSM()
	});

	 map.addLayer(layerOSM);

   modisgrd=new ol.layer.Image({
     source: new ol.source.ImageWMS({
         url: mapUrl,
         params: {'LAYERS': 'plkwater:modis_grid'},
         serverType: 'geoserver'
     })
   });
   map.addLayer(modisgrd);

   modispnt=new ol.layer.Image({
     source: new ol.source.ImageWMS({
         url: mapUrl,
         params: {'LAYERS': 'plkwater:modis_point'},
         serverType: 'geoserver'
     })
   });
   map.addLayer(modispnt);

  // layer=new ol.layer.Tile({
  //        visible: true,
  //        source: new ol.source.TileWMS({
  //             url: mapUrl,
  //             params: {'LAYERS': "Landsat8Extract", 'TILED': true},
  //             serverType: 'mapserver'
  //            })
  //        });
  //
	//  map.addLayer(layer);

	layer = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});

	SubwayStops = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false
	    }),
	    style: style1,
	    updateWhileAnimating: true,
	    updateWhileInteracting: true
	});


        $(window).on("resize", applyMargins);


        applyInitialUIState();
        applyMargins();

	 $("#serviceIdentifier").change(function(){
	     getDescription($(this).val());
	 });
	 getDescription($("#serviceIdentifier").val());
    });
    }

    function getDescription(identifier){
	$("#layers,#layers_display").find(".panel-body").css({"height":($(window).height()/3)+"px"});
	$("#layers,#layers_display").find(".panel-body").css({"max-height":($(window).height()/3)+"px"});
	zoo.describeProcess({
	    identifier: identifier,
	    type: "POST",
	    success: function(data) {
		data["Identifier1"]=data.ProcessDescriptions.ProcessDescription.Identifier.__text.replace(/\./g,"__");
		data.ProcessDescriptions.ProcessDescription.Identifier1=data.ProcessDescriptions.ProcessDescription.Identifier.__text.replace(/\./g,"__");
		for(var i in data.ProcessDescriptions.ProcessDescription.DataInputs.Input){
		    if(data.ProcessDescriptions.ProcessDescription.DataInputs.Input[i]._minOccurs=="0")
			data.ProcessDescriptions.ProcessDescription.DataInputs.Input[i].optional=true;
		    else
			data.ProcessDescriptions.ProcessDescription.DataInputs.Input[i].optional=false;
		}
		var details =  tpl_describeProcess(data);
		$(".main-row").find(".panel-body").first().html(details);
		$("#btn-wps-execute").click(function(){
		    launchProcessing(identifier);
		});
	    },
	    error: function(data) {
		notify('DescribeProcess failed', 'danger');
	    }
	});
    }

    var filename="http://geolabs.fr/dl/Landsat8Extract1.tif";
    function launchProcessing(aProcess) {
	notify('Running '+aProcess+' service','info');
	var iparams=[];
	$("#layers").find(".pm-popup").find("input[type=text],select").each(function(){
	    var lname=$(this).attr("id").replace(/wps_i_/g,"");
	    console.log(lname);
	    if($(this).is(":visible") && lname!=$(this).attr("id"))
		iparams.push({
		    identifier: lname,
		    value: $(this).val(),
		    dataType: "string"
		});
	});
	$("#layers").find(".pm-popup").find("input[type=hidden]").each(function(){
	    var lname=$(this).attr("id").replace(/wps_i_/g,"");
	    console.log(lname);
	    if($(this).parent().is(":visible") && lname!=$(this).attr("id"))
		iparams.push({
		    identifier: lname,
		    href: $(this).val(),
		    mimeType: "image/tiff"
		});
	});
	var oparams=[];
	$("#layers").find(".pm-popup").find("select").each(function(){
	    var lname=$(this).attr("id").replace(/format_wps_o_/g,"");
	    console.log(lname);
	    if($(this).is(":visible") && lname!=$(this).attr("id"))
		oparams.push({
		    identifier: lname,
		    mimeType: $(this).val(),
		    asReference: "true"
		});
	});
	console.log(iparams);
	console.log(oparams);
	var progress=$("#progress-process");
	zoo.execute({
	    identifier: aProcess,
	    dataInputs: iparams,
	    dataOutputs: oparams,
	    type: 'POST',
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
			progress.attr("aria-valuenow",data.percentCompleted);
			$("#infoMessage").html(data.text+' : '+(data.percentCompleted)+'%');
                    },
                    onProcessSucceeded: function(data) {
			console.log("**** ProcessSucceeded ****");
			//console.log(data);

			progress.css('width', (100)+'%');
			progress.text(data.text+' : '+(100)+'%');
			progress.removeClass("progress-bar-info").addClass("progress-bar-success");
			progress.attr("aria-valuenow",100);
			$("#infoMessage").html(data.text+' : '+(100)+'%');

			notify(aProcess+' service run successfully','success');
			console.log(data);//.ExecuteResponse.ProcessOutputs.Output.Reference._href);
			var ldata=data.result.ExecuteResponse.ProcessOutputs.Output;
			if(!$.isArray(ldata))
			    ldata=[data.result.ExecuteResponse.ProcessOutputs.Output];
			for(var a=0;a<ldata.length;a++){
			    console.log(ldata[a]);
			    var lmapUrl=ldata[a].Reference._href.split('&')[0];
			    console.log(lmapUrl);
			    var content=$("#addLayer_template")[0].innerHTML.replace(/lname/g,ldata[a].Identifier.toString());
			    if(lmapUrl.replace(/map/g,"")!=lmapUrl){
				layer=new ol.layer.Tile({
				    visible: true,
				    source: new ol.source.TileWMS({
					url: lmapUrl,
					params: {'LAYERS': ldata[a].Identifier.toString(), 'TILED': true},
					serverType: 'mapserver'
				    })
				});
				map.addLayer(layer);
				content=content.replace(/ldata/g,"#");
				content=content.replace(/lcheck/g,'<input id="layerd'+currentLID+'" name="name" type="checkbox" checked="checked" />');
				currentLID+=1;
			    }else{
				content=content.replace(/ldata/g,ldata[a].Reference._href);
				content=content.replace(/lcheck/g,'<input name="name" type="checkbox" checked="checked" disabled="disabled" />');
			    }
			    console.log(content);
			    $("#layers_display").find(".list-group").first().append(content);
			    $("#layers_display").find(".layerItem").find("input[type=checkbox]").each(function(){
				$(this).off("change");
				$(this).on("change",function(){
				    var lid=parseInt($(this).attr("id").replace(/layerd/g,""));
				    map.getLayers().item(2+lid).setVisible($(this).is(":checked"));
				});
			    });
			    $("#layers_display").find(".removeLayer").each(function(){
				$(this).off("click");
				$(this).on("click",function(){
				    if(!$(this).prev().prev().is(":disabled")){
					var lid=parseInt($(this).prev().prev().attr("id").replace(/layerd/g,""));
					map.getLayers().item(2+lid).setVisible(false);
				    }
				    $(this).parent().remove();
				});
			    });
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
		        notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
            }
        });
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


    // Return public methods
    return {
        initialize: initialize,
        getDescription: getDescription,
	cgalProcessing: launchProcessing
    };


});
