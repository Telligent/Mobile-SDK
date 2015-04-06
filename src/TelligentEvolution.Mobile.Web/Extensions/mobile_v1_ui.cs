using System;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Services;
using System.Collections;
using System.Text;

namespace Telligent.Evolution.Mobile.Web.Extensions
{
	public class MobileUiExtension : IScriptedContentFragmentExtension
	{
		public object Extension
		{
			get { return new MobileUiExtensionApi(); }
		}

		public string ExtensionName
		{
			get { return "mobile_v1_ui"; }
		}
	}

	public class MobileUiExtensionApi
	{
		public string Comments(Guid contentId, Guid contentTypeId)
		{
			return Comments(contentId, contentTypeId, null);
		}

		public string Comments(Guid contentId, Guid contentTypeId, [
			Documentation(Name = "TypeId", Type = typeof(string), Description = "Type Id")]
			IDictionary options)
		{
			var commentsComponent = new StringBuilder();
			commentsComponent.Append(@"<div class=""ui-comments"" ");
			commentsComponent.AppendFormat(String.Format(@"data-contentid=""{0}"" ", contentId.ToString()));
			commentsComponent.AppendFormat(String.Format(@"data-contenttypeid=""{0}"" ", contentTypeId.ToString()));
			if (options != null)
			{
				Guid commentTypeId;
				if (options["TypeId"] != null && Guid.TryParse(options["TypeId"].ToString(), out commentTypeId))
				{
					commentsComponent.AppendFormat(String.Format(@"data-typeid=""{0}"" ", commentTypeId.ToString()));		
				}

				if (options["CanFlagAsAbusive"] != null)
				{
					commentsComponent.AppendFormat(String.Format(@"data-canflagasabusive=""{0}"" ",
						(options["CanFlagAsAbusive"].ToString().ToLower() == "true").ToString().ToLowerInvariant()));						
				}

				int accessingUserId;
				if (options["AccessingUserId"] != null && int.TryParse(options["AccessingUserId"].ToString(), out accessingUserId))
				{
					commentsComponent.AppendFormat(String.Format(@"data-accessinguserid=""{0}"" ", accessingUserId.ToString()));
				}
			}
			commentsComponent.Append(" ></div>");

			return commentsComponent.ToString();
		}
	}
}