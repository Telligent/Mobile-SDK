(function($, global, undef){

	var createStatus = function(options) {
		$.telligent.evolution.mobile.showLoading();
		return $.telligent.evolution.post({
			url: options.addStatusUrl,
			data: {
				message: options.message.evolutionComposer('val'),
				fileName: options.attachedFileName,
				contextId: options.uploadContextId,
				groupId: options.groupId
			},
			success: function(response) {
				$.telligent.evolution.mobile.back(true);
			},
			fail: function() {
				$.telligent.evolution.mobile.hideLoading();
			}
		});
	},
	loadPreview =  function(context, fileName) {
		if(fileName)  {
			context.attachedFileName = fileName;
		}
		clearTimeout(context.previewTimeout);
		context.previewTimeout = setTimeout(function(){
			var data = {
				w_messageBody: context.message.evolutionComposer('val'),
				w_groupId: context.groupId
			};
			if(context.attachedFileName) {
				data.w_attachedFileName = context.attachedFileName;
				data.w_attachedFileContext = context.uploadContextId;
			}
			$.telligent.evolution.post({
				url: context.previewAttachmentUrl,
				data: data,
				success: function(response) {
					response = $.trim(response);
					if(response && response.length > 0) {
						if (response !== context.previewContent) {
							context.previewContent = response;
							context.previewContainer.html(context.previewContent);
							context.previewContainer.slideDown(100);
							if(context.post)
								context.post.show();
						}
					} else {
						context.previewContent = '';
						context.previewContainer.html('');
						context.previewContainer.slideUp(100);
						if(!$('body').hasClass('touch') && context.post)
							context.post.hide();
					}
				}
			});
		}, 150);
	},
	clearPreview = function(context) {
		context.previewContainer.slideUp(100);
		clearTimeout(context.previewTimeout);
		context.attachedFileName = null;
		context.previewContent = null;
		context.previewContainer.empty();
	},
	initializeFileUpload = function(context) {
		context.fileUpload.glowUpload({
			fileFilter: null,
			uploadUrl: context.uploadFileUrl,
			renderMode: 'link'
		}).on('glowUploadBegun', function(e) {
			context.uploading = true;
			validate(context);
			context.fileUpload.html(context.progressMessage.replace('{0}', 0));
			$('#' + context.uploadButtonId).removeClass('with-icon');
		}).on('glowUploadComplete', function(e, file) {
			loadPreview(context, file.name);
			context.uploading = false;
			context.fileUpload.html(context.changeFileMessage).removeClass('upload').addClass('change');
			context.fileRemove.show();
			validate(context);
		}).on('glowUploadFileProgress', function(e, details) {
			context.fileUpload.html(context.progressMessage.replace('{0}', details.percent));
		});
	},
	validate = function(context) {
		if ($.trim(context.message.val()) == "" || context.uploading === true) {
			return false;
		}

		return true;
	},
	removeFile = function(context) {
		context.fileRemove.hide();
		context.attachedFileName = null;
		context.uploading = false;
		loadPreview(context);
		context.fileUpload.html(context.uploadFileMessage).addClass('upload').removeClass('change');
		$('#' + context.uploadButtonId).addClass('with-icon');
	};

	var api = {
		register: function(options) {
			options.wrapper = $(options.wrapper);
			options.fileUpload = $('.upload', options.wrapper);
			options.previewContainer = $('.preview', options.wrapper);
			options.fileRemove = $('.remove', options.wrapper);
			options.message = $(options.bodyId);
			options.previewTimeout = null;
			options.attachedFileName = null;
			options.previewContent = null;
			options.uploading = false;
			var postLink;

			postLink = $('<a href="#" class="submit">' + options.postLabel + '</a>');
			$.telligent.evolution.mobile.setHeaderButton(postLink);
			postLink.hide();

			options.message.evolutionComposer({
				plugins: ['mentions','hashtags','urlhighlight'],
				focus: false
			}).evolutionComposer('oninput', function(e){
				clearTimeout(options.inputPreviewHandle);
				options.inputPreviewHandle = setTimeout(function() {
					loadPreview(options);
				}, 999);
			}).focus(function(){
				postLink.show();
			}).blur(function(){
				validate(options);
			}).focus();

			initializeFileUpload(options);

			options.fileRemove.click(function() {
				removeFile(options);
				return false;
			});


			postLink.on('tap', function(){
				if (validate(options)) {
					createStatus(options);
				}
				return false;
			});

			validate(options);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.createStatus = api;

})(jQuery, window);