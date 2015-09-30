/// @name glowUpload
/// @category jQuery Plugin
/// @description Renders a single file upload form supporting chunked uploads with a visual progress bar
///
/// ### jQuery.fn.glowUpload
///
/// Renders a single file upload form supporting chunked uploads
///
/// Mobile override of the platform-defined `glowUpload`
///
/// ### Usage
///
///     $('SELECTOR').glowUpload(options)
///
/// where 'SELECTOR' is a div element containing file input
///
/// ### Options
///
///  * `takePhotoOrVideoText`: (string) *default*: 'Take a photo'
///  * `chooseExistingText`: (string) *default*: 'Choose existing'
///  * `cancelText`: (string) *default*: 'Cancel'
///
/// ### Methods
///
/// #### val
///
/// Returns the file name of the uploaded file
///
///     var fileName = $('SELECTOR').glowUpload('val');
///
define('glowUpload', ['environment'],
function(environment, $, global, undef) {
	if (environment.type != 'native' || !global.navigator.camera || !global.FileTransfer) {
		return;
	}

    // public api
    var api = {
        val: function() {
            var context = $(this).data(_dataKey);
            if(context !== null && typeof context.file !== 'undefined' && context.file !== null) {
                return { name: context.file.name };
            } else {
                return null;
            }
        }
    };

    // private methods
    var _dataKey = '_glowUpload',
        _eventNames = {
            begun: 'glowUploadBegun',
            complete: 'glowUploadComplete',
            error: 'glowUploadError',
            progress: 'glowUploadFileProgress'
        },
        _init = function(options) {
            return this.each(function()
            {
                var elm = $(this);

                var context = $.extend({}, $.fn.glowUpload.defaults, options || {}, {
                    file: null,
                    fileOffset: 0,
                    fileState: '',
                    isUploading: false,
                    currentUploadPercent: 0,
                    fileContainer: null
                });

                $.extend(context, {
                    container: elm,
                    initialized: false
                });

                $(this).data(_dataKey, context);

                context.container.find('input[type="file"]')
                .bind('change', function(){
                    _inputChange(context);
                }).hide();

				if (context.renderMode != 'link' && context.renderMode != 'dragdrop') {
	            	$('<div></div>')
	                .css({
	                    fontSize: '11px',
	                    borderWidth: '1px',
	                    borderStyle: 'solid',
	                    borderColor: '#999',
	                    width: context.width,
	                    overflow: 'auto',
	                    overflowX: 'hidden',
	                    backgroundColor: '#eee',
	                    textAlign: 'center',
	                    padding: '.25em'
	                })
	                .append($('<input type="Button" value="Loading..." />')
	                	.attr('disabled','disabled')
	                	.css({
	                		borderColor: 'Transparent',
	                		backgroundColor: 'Transparent'
	                	})
	                )
	                .appendTo(context.container)
		        }

                _determineUploadSpeed(context);
            });
        },
        _determineUploadSpeed = function(context) {
        	var testStrings = ["1234567890", "0987654321", "0192837465", "5647382910"];
        	var testData = [];
        	for (var i = 0; i < 2500; i++) { testData[testData.length] = testStrings[Math.floor((Math.random()*testStrings.length))]; }
        	var startMs = (new Date()).getTime();

        	jQuery.ajax({
        		type: 'POST',
        		url: context.uploadUrl,
        		data: {
        			test: testData.join('')
        		},
        		success: function() {
        			var endMs = (new Date()).getTime();
       				_initialize(context, ((25000 * 8) / ((endMs - startMs) / 1000)) * 45);
        		},
        		error: function() {
        			// test failed: default to max upload of 1mb
       				_initialize(context, 1000000);
        		}
        	});
        },
        _initialize = function(context, maxUploadSpeed) {
        	var browseButton = null;

        	var chunkSize = '15000000';
            if (maxUploadSpeed < 15000000)
            {
            	chunkSize = Math.floor(maxUploadSpeed);
            	if (chunkSize < 100000)
            	{
            		chunkSize = 100000
            	}
            }

            // remove the non-plupload control
            if (context.renderMode != 'link' && context.renderMode != 'dragdrop') {
            	context.container.children().remove();

            	context.container.addClass('glow-upload');

	            var innerContainer = $('<div></div>')
	                .css({
	                    fontSize: '11px',
	                    borderWidth: '1px',
	                    borderStyle: 'solid',
	                    borderColor: '#999',
	                    width: context.width,
	                    overflow: 'auto',
	                    overflowX: 'hidden',
	                    backgroundColor: '#fff'
	                })
	                .appendTo(context.container);

	            var table = $('<table></table>')
	                .attr('border', 0)
	                .attr('cellSpacing', 0)
	                .attr('cellPadding', 0)
	                .css({
	                    width: '100%'
	                });

	            var tbody = $('<tbody></tbody>')
	                .appendTo(table);

	            var tr = $('<tr></tr>')
	                .appendTo(tbody);

	            context.fileContainer = $('<td></td>')
	                .appendTo(tr)
	                .css({ width: '100%' });

	            var td = $('<td></td>')
	                .css({
	                    backgroundColor: '#eee',
	                    borderLeftWidth: '1px',
	                    borderLeftStyle: 'solid',
	                    borderLeftColor: '#999',
	                    padding: '.25em'
	                })
	                .attr('vAlign', 'top')
	                .appendTo(tr);

	            browseButton = $('<input type="Button" value="' + context.selectFileLabel + '" id="' + context.container.attr('id') + '_browseButton" />')
	                .appendTo(td);

	            innerContainer.append(table);

	            _updateFileUi(context);

	            context.pluploader.settings.browse_button = context.container.attr('id') + '_browseButton';
            } else if (context.renderMode == 'link') {
            	browseButton = $('#' + context.container.attr('id'));
            } else {
            	var button = $('<div></div>').css({
            		position: 'absolute',
            		left: '-10000px',
            		top: '-10000px',
            		height: '1px',
            		width: '1px',
            		overflow: 'hidden'
            	}).attr('id', context.container.attr('id') + '_browseButton');
            	context.container.append(button);

            	browseButton = $('#' + button.attr('id'));
            }

            browseButton.on('click', function(e) {
            	e.stopPropagation();
            	e.preventDefault();

            	var cameraLink = $('<a href="#" class="link"></a>').text(context.takePhotoOrVideoText);
            	cameraLink.on('click', function() {
            		e.stopPropagation();
            		e.preventDefault();
            		$.telligent.evolution.mobile.hideSheet();
            		global.navigator.camera.getPicture(
	            		function(imageUri) {
	            			setTimeout(function() {
		            			_selectFileByUri(context, imageUri, chunkSize);
							}, 9);
	            		},
	            		function(errorMessage) {
	            			setTimeout(function() {
	            				_error(context, { message: errorMessage, id: -1 });
	            			}, 9);
	            		},
	            		{
	            			destinationType: Camera.DestinationType.FILE_URI,
	            			sourceType: Camera.PictureSourceType.CAMERA,
	            			quality: 85,
	            			encodingType: Camera.EncodingType.JPEG
	            		}
	            	);
	            	return false;
            	});

            	var galleryLink = $('<a href="#" class="link"></a>').text(context.chooseExistingText);
            	galleryLink.on('click', function() {
            		e.stopPropagation();
            		e.preventDefault();
            		$.telligent.evolution.mobile.hideSheet();
            		global.navigator.camera.getPicture(
	            		function(imageUri) {
	            			setTimeout(function() {
		            			_selectFileByUri(context, imageUri, chunkSize);
							}, 9);
	            		},
	            		function(errorMessage) {
	            			setTimeout(function() {
	            				_error(context, { message: errorMessage, id: -1 });
	            			}, 9);
	            		},
	            		{
	            			destinationType: Camera.DestinationType.FILE_URI,
	            			sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
	            			quality: 85,
	            			encodingType: Camera.EncodingType.JPEG
	            		}
	            	);
	            	return false;
            	});

            	var cancelLink = $('<a href="#" class="action-cancel"></a>').text(context.cancelText);
            	cancelLink.on('click', function() {
            		$.telligent.evolution.mobile.hideSheet();
            	});

            	$.telligent.evolution.mobile.displaySheet({
					links: [
						cameraLink,
            			galleryLink,
            			cancelLink
					]
				});

            	return false;
            });

            context.initialized = true;
        },
        _selectFileByUri = function(context, fileUri, chunkSize) {
        	var error = function() {
            	context.isUploading = false;
        		context.fileState = 'error';
        		_updateFileUi(context);
        		global.navigator.camera.cleanup(function() { }, function() { });
				context.container.trigger('glowUploadError');
            };

            var uploadFile = function(fileEntry) {
    			context.file = {
    				name: fileName
    			};
    			context.fileState = '';
    			_updateFileUi(context);

    			if (!context.isUploading)
                {
                    var execEvent = !context.isUploading;
                    context.isUploading = true;
                    context.currentUploadPercent = 0;
                    _updateFileUi(context);
                    if (execEvent) {
                        context.container.trigger(_eventNames.begun);
                    }
                }

    			fileEntry.file(function(file) {
    				var chunk = -1;
    				var chunks = Math.ceil(file.size / chunkSize);

    				var uploadNext = function() {
    					chunk++;
    					if (chunk >= chunks) {
    						context.isUploading = false;
		            		context.fileState = 'uploaded';
		            		_updateFileUi(context);
		            		global.navigator.camera.cleanup(function() { }, function() { });
		            		context.container.trigger(_eventNames.complete, { name: fileName });
		            		return;
    					}

    					var chunkFile = file.slice(Math.floor(chunk * chunkSize), Math.min(Math.floor((chunk + 1) * chunkSize), file.size));

    					global.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fileSystem) {
    						fileSystem.root.getFile('zimbra-' + chunk + '.chunk', { create: true, exclusive: false }, function(chunkTempFile) {
    							var reader = new FileReader();
    							reader.onloadend = function(readEvent) {
        							chunkTempFile.createWriter(function(chunkTempWriter) {
        								chunkTempWriter.onwriteend = function() {
        									var chunkTransfer = new FileTransfer();
            								var immediateProgress = 0;
            								chunkTransfer.onprogress = function(progressEvent) {
            									if (progressEvent.lengthComputable) {
            										immediateProgress = progressEvent.loaded / progressEvent.total;
            									} else {
            										immediateProgress += .01;
            										if (immediateProgress > 1) {
            											immediateProgress = 1;
            										}
            									}

            									try {
        											context.currentUploadPercent = Math.round(((chunk / chunks) + (immediateProgress / chunks)) * 100);
									                _updateFileUi(context);
									                context.container.trigger(_eventNames.progress, { name: fileName, percent: context.currentUploadPercent });
        										} catch (err) {
        										}
            								};

            								chunkTransfer.upload(
            									chunkTempFile.toURL(),
            									context.uploadUrl,
            									function() {
            										context.currentUploadPercent = Math.round(((chunk + 1) / chunks) * 100);
            										chunkTempFile.remove(null, null);
		            								global.setTimeout(function() { uploadNext(); }, 9);
									                _updateFileUi(context);
									                context.container.trigger(_eventNames.progress, { name: fileName, percent: context.currentUploadPercent });
            									},
            									function() {
            										chunkTempFile.remove(null, null);
            										error();
            									},
            									{
            										fileKey: 'file',
            										fileName: fileName,
            										params: {
            											name: fileName,
            											chunk: chunk,
            											chunks: chunks
            										},
            										chunkedMode: false
            									});
        								};
        								chunkTempWriter.write(readEvent.target.result);
        							}, function() {
        								chunkTempFile.remove(null, null);
        								error();
        							});
        						};
        						reader.readAsArrayBuffer(chunkFile);
    						}, error);
    					}, error);
    				}

    				uploadNext();
		    	}, error);
            }

            var fileName = 'image' + (new Date()).getTime() + '.jpg';

            if (fileUri.indexOf('file://') == 0) {
            	// resolve the local file
            	global.resolveLocalFileSystemURI(fileUri,
					uploadFile,
			    	error
			    	);
            } else {
            	// attempt to download the file first
            	global.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fileSystem) {
            		fileSystem.root.getFile(
            			'download.tmp',
            			{
            				create: true,
            				exclusive: false
            			},
            			function (fileEntry) {
		            		var path = fileEntry.toURL();
		        			var fileTransfer = new FileTransfer();
		        			fileTransfer.download(
		        				fileUri,
		        				path,
		        				uploadFile,
	        					error,
		        				true,
		        				{ }
		        			);
		        		},
		        		error);
            	}, error);
            }
        },
        _updateFileUi = function(context)
        {
        	if (context.renderMode != 'link' && context.renderMode != 'dragdrop') {
	            var ui = '';

	            if (context.file)
	            {
	                if (context.fileState === 'uploaded') {
	                    ui = context.uploadedFormat.replace('{0}', context.file.name);
	                }
	                else if (context.fileState === 'error') {
	                    ui = context.errorFormat.replace('{0}', context.file.name);
	                }
	                else if (context.isUploading) {
	                    ui = context.uploadingFormat.replace('{0}', context.file.name).replace('{1}', context.currentUploadPercent);
	                }
	                else {
	                    ui = context.toUploadFormat.replace('{0}', context.file.name);
	                }
	            }

	            context.fileContainer.html(ui);
			}
        },
        _error = function(context, err)
        {
            if (!context.initialized) {
            	context.container.children().hide();
            }

            if (err.file)
            {
                context.isUploading = false;
                context.fileState = 'error';
                _updateFileUi(context);

                context.container.trigger(_eventNames.error);
            }
        };

    var defaults = ($.fn.glowUpload || {}).defaults || {};
    defaults = $.extend({}, defaults, {
    	takePhotoOrVideoText: 'Take a photo',
    	chooseExistingText: 'Choose existing',
    	cancelText: 'Cancel'
    });

    $.fn.glowUpload = function(method) {
        if(method in api) {
            return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return _init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.fn.glowUpload');
        }
    };

    $.extend($.fn.glowUpload, {
        defaults: defaults
    });

	return {};
}, jQuery, window);

