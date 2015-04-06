using System;
using System.Collections.Generic;
using System.Web.Routing;
using System.Text.RegularExpressions;

namespace Telligent.Evolution.Mobile.Web.Model
{
	internal class Page
	{
		internal static Regex _findTokens = new Regex(@"\{[^\}]*\}");

		internal Page(Guid id, string name, string path)
		{
			Id = id;
			Name = name;
			Path = path;
			PathParameterContraints = new RouteValueDictionary();
			PathParameterDefaults = new RouteValueDictionary();
			ContentFragments = new List<ConfiguredContentFragment>();
		}

		public Guid Id { get; private set; }
		public string Name { get; private set; }
		public string Path { get; private set; }

		private string _formatString = null;
		public string FormatString 
		{
			get
			{
				if (_formatString == null)
				{
					int index = -1;
					_formatString = _findTokens.Replace(Path, new MatchEvaluator(match => { index++; return string.Concat("{", index.ToString("0"), "}"); }));
				}

				return _formatString;
			}
		}
		
		public RouteValueDictionary PathParameterDefaults { get; private set; }
		public RouteValueDictionary PathParameterContraints { get; private set; }
		public IList<ConfiguredContentFragment> ContentFragments { get; private set; }
	}
}