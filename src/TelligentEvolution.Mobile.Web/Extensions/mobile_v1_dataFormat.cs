using System;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Services;
using System.Collections;
using System.Text;
using System.Text.RegularExpressions;

namespace Telligent.Evolution.Mobile.Web.Extensions
{
	public class MobileDataFormatExtension : IScriptedContentFragmentExtension
	{
		public object Extension
		{
			get { return new MobileDataFormatExtensionApi(); }
		}

		public string ExtensionName
		{
			get { return "mobile_v1_dataFormat"; }
		}
	}

	public class MobileDataFormatExtensionApi
	{
		private readonly IMobileConfiguration Config = ServiceLocator.Get<IMobileConfiguration>();
		private readonly Regex FindText = new Regex(@"(?:(?<exclude><(?<excludetag>a|script|style|textarea)(?:\s[^>]*)?>.*?</\k<excludetag>>)|(?<detect>(?<=^|(?:<[^>]*>))[^<>]+(?=<|$)))", RegexOptions.Singleline | RegexOptions.IgnoreCase);
		private readonly Regex NonNumbers = new Regex(@"[^\d]+", RegexOptions.Singleline);
		private Regex _findPhoneNumbers = null;

		public string Detect(string html)
		{
			if (string.IsNullOrEmpty(html))
				return html;

			return FindText.Replace(html, new MatchEvaluator((Match text) => {
				if (!text.Groups["detect"].Success) {
					return text.Value;
				} else {
					return FindPhoneNumbers.Replace(text.Value, new MatchEvaluator((Match number) => {
						return string.Concat(
							"<a href=\"tel:",
							NonNumbers.Replace(number.Value, ""),
							"\">",
							number.Value,
							"</a>"
							);
					}));
				}
			}));
		}

		private Regex FindPhoneNumbers
		{
			get
			{
				if (_findPhoneNumbers == null)
				{
					lock (typeof(MobileDataFormatExtensionApi))
					{
						if (_findPhoneNumbers == null)
							_findPhoneNumbers = new Regex(Config.TelephonePattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
					}
				}

				return _findPhoneNumbers;
			}
		}
	}
}