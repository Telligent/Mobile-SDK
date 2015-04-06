(function($, global, undef){

	var _createFile = function(options) {

		$.telligent.evolution.mobile.showLoading();

		var data = {};
		if (options.file && options.file.isNew) {
			if (options.file.isRemote) {
				data.FileName = options.file.url;
				data.FileUrl = options.file.url;
			} else {
				data.FileName = options.file.fileName;
				data.FileUploadContext = options.uploadContextId;
			}
		}

		if(options.mode == 'add') {
			data.Name = options.title;
			data.Description = options.description;
			data.mediagalleryid = options.mediaGalleryId;
			data.ContentType = options.fileType;

			$.telligent.evolution.post({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/media/{mediagalleryid}/files.json',
				data: data,
				success: function(response) {
					$.telligent.evolution.put({
						url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/media/{mediagalleryid}/files/{fileid}/subscriptions.json',
						data: {
							mediagalleryid: response.Media.MediaGalleryId,
							fileid: response.Media.Id,
							IsSubscribed: options.subscribe
						},
						success: function(answer) {

						}
					});
					var link = '/mediafiles/' + response.Media.Id;
					$.telligent.evolution.mobile.load(link, { refresh: true });
				}
			})
			.fail(function() {
				$.telligent.evolution.mobile.hideLoading();
			});
		} else if (options.mode == 'edit') {
			data.mediagalleryid = options.mediaGalleryId;
			data.fileid = options.fileId;
			data.Name = options.title;
			data.Description = options.description;
			$.telligent.evolution.put({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/media/{mediagalleryid}/files/{fileid}.json',
				data: data,
				success: function(response) {
					$.telligent.evolution.put({
						url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/media/{mediagalleryid}/files/{fileid}/subscriptions.json',
						data: {
							mediagalleryid: response.Media.MediaGalleryId,
							fileid: response.Media.Id,
							IsSubscribed: options.subscribe
						},
						success: function(answer) {

						}
					});
					var link = '/mediafiles/' + response.Media.Id;
					$.telligent.evolution.mobile.load(link, { refresh: true });
				}
			})
			.fail(function() {
				$.telligent.evolution.mobile.hideLoading();
			});
		}
	},

	_lookUp = function(options) {
		$.telligent.evolution.post({
			url: options.lookUpUrl,
			data: {
				fileType: options.file.fileName
			},
			success: function(response) {
				options.fileType = response.type;
			}
		});
	}

	var api = {
		register: function(options) {
			_lookUp(options);

			options.attachment = $('#' + options.attachmentId);
        	options.attachmentUpload = options.attachment.find('a.upload');
        	options.attachmentRemove = options.attachment.find('a.remove');
        	options.attachmentName = options.attachment.find('input');
        	options.attachmentPreview = options.attachment.find('.preview');

        	function loadPreview() {
            	if (options.file && (options.file.fileName || options.file.url)) {
            		clearTimeout(options.attachmentPreviewTimeout);
			        options.attachmentPreviewTimeout = setTimeout(function(){
			            var data = {
			            	w_uploadContextId: options.uploadContextId
			            };
			            if(options.file.url) {
			                data.w_url = options.file.url;
			            }
			            if (options.file.fileName) {
			            	data.w_filename = options.file.fileName;
			            }
			            $.telligent.evolution.post({
			                url: options.previewAttachmentUrl,
			                data: data,
			                success: function(response) {
			                    response = $.trim(response);
								if(response && response.length > 0 && response !== options.attachmentPreviewContent) {
									options.attachmentPreviewContent = response;
									options.attachmentPreview.html(options.attachmentPreviewContent).removeClass('empty');
								}
			                }
			            });
			        }, 150);
            	} else {
            		options.attachmentPreviewContent = '';
            		options.attachmentPreview.html('').addClass('empty');
            	}
            }

        	options.attachmentRemove.hide();
        	if (options.file && options.file.url && options.file.isRemote) {
        		options.attachmentRemove.hide();
        	} else if (options.file && options.file.fileName && !options.file.isRemote) {
        		options.attachmentName.attr('readonly', 'readonly');
        		options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
        		options.attachmentRemove.show();
        	} else if (options.attachment.data('link') != 'True') {
        		options.attachmentName.attr('readonly', 'readonly');
        	}

        	loadPreview();

        	options.attachmentName.on('keyup change', function() {
        		if (!options.attachmentName.attr('readonly')) {
	        		options.file = {
	        			url: $(this).val(),
	        			isRemote: true,
	        			isNew: true
	        		}
	        		loadPreview();
	        	}
        	});

        	options.attachmentRemove.click(function() {
        		options.file = null;
        		options.attachmentName.val('');
        		options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add')
        		if (options.attachment.data('link') == 'True') {
	        		options.attachmentName.removeAttr('readonly');
	        	}
	        	options.attachmentRemove.hide();
	        	loadPreview();
	        	return false;
        	});

			options.attachmentUpload.glowUpload({
				fileFilter: null,
				uploadUrl: options.uploadFileUrl,
				renderMode: 'link'
			})
			.bind('glowUploadBegun', function(e) {
	            options.uploading = true;
	            options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', 0));
	        })
	        .bind('glowUploadComplete', function(e, file) {
	        	if (file && file.name.length > 0) {
					options.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					}
					_lookUp(options);

					options.attachmentName.val(options.file.fileName).attr('readonly', 'readonly');
		            loadPreview();
		            options.uploading = false;
		            options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
		            options.attachmentRemove.show();
		    	}
	        })
	        .bind('glowUploadFileProgress', function(e, details) {
	        	options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
	        });

			postLink = $('<a href="#" class="submit">' + (options.mode == 'add' ? options.postLabel : options.editLabel) + '</a>');
			$.telligent.evolution.mobile.setHeaderButton(postLink);

			postLink.on('tap', function(){
				var titleInput = $(options.titleInput),
				bodyInput = options.getBodyContent(),
				subscribeInput = $(options.subscribeInput);

				options.title =  titleInput.val();
				options.description = bodyInput;
				options.subscribe = subscribeInput.is(':checked');

				_createFile(options);
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.mediaGalleryAddEdit = api;

})(jQuery, window);