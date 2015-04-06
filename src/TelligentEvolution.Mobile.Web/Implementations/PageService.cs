using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web.Model;
using Telligent.Evolution.Mobile.Web.Services;
using System.Xml;
using System.IO;

namespace Telligent.Evolution.Mobile.Web.Implementations
{
	internal class PageService : IPageService, IConfiguredContentFragmentService
	{
		private EventHandler _changedEventHandlers;
		private string _path;
		private FileSystemWatcher _watcher;
		private Dictionary<Guid, Page> _pages;
		private object _pageLoadLock = new object();

		internal PageService()
		{
			var dir = new DirectoryInfo(Path.GetDirectoryName(GetType().Assembly.CodeBase).Substring(6));
			_path = Path.Combine(dir.Parent.FullName, "Resources");
			_pages = null;

			_watcher = new FileSystemWatcher(_path);
			_watcher.Changed += new FileSystemEventHandler(watcher_Changed);
			_watcher.EnableRaisingEvents = true;
		}

		void watcher_Changed(object sender, FileSystemEventArgs e)
		{
			lock (_pageLoadLock)
			{
				_pages = null;
			}

			if (_changedEventHandlers != null)
				_changedEventHandlers(this, EventArgs.Empty);
		}

		public IEnumerable<Page> GetAll()
		{
			return GetDictionary().Values;
		}

		private Dictionary<Guid, Page> GetDictionary()
		{
			var pages = _pages;
			if (pages == null)
			{
				lock (_pageLoadLock)
				{
					pages = _pages;
					if (pages == null)
					{
						pages = new Dictionary<Guid, Page>();

						foreach (var file in System.IO.Directory.EnumerateFiles(_path, "*.xml").OrderBy(x => x))
						{
							XmlDocument doc = new XmlDocument();
							XmlReaderSettings settings = new XmlReaderSettings();
							settings.DtdProcessing = DtdProcessing.Prohibit;
							using (XmlReader reader = XmlReader.Create(file, settings))
							{
								doc.Load(reader);
								var node = doc.SelectSingleNode("descendant::pages");
								if (node != null)
									foreach (var page in DeserializePages(node))
									{
										pages[page.Id] = page;
									}
							}
						}

						_pages = pages;
					}
				}
			}

			return pages;
		}

		public event EventHandler Changed
		{
			add { _changedEventHandlers += value; }
			remove { _changedEventHandlers -= value; }
		}

		public Page Get(Guid id)
		{
			Page p;
			if (GetDictionary().TryGetValue(id, out p))
				return p;

			return null;
		}

		public string GetHostIdentifier(ConfiguredContentFragment fragment)
		{
			return string.Concat(fragment.PageId.ToString("N"), ":", fragment.HostId.ToString("N"));
		}

		public ConfiguredContentFragment GetByHostIdentifier(string hostIdentifier)
		{
			if (string.IsNullOrEmpty(hostIdentifier))
				return null;

			string[] components = hostIdentifier.Split(':');
			Guid pageId;
			Guid fragmentId;
			if (components.Length != 2 || !Guid.TryParse(components[0], out pageId) || !Guid.TryParse(components[1], out fragmentId))
				return null;

			var page = Get(pageId);
			if (page == null)
				return null;

			return page.ContentFragments.FirstOrDefault(x => x.HostId == fragmentId);
		}

		#region Helpers

		private IEnumerable<Page> DeserializePages(XmlNode node)
		{
			List<Page> pages = new List<Page>();
			foreach (XmlNode pageNode in node.ChildNodes)
			{
				var page = DeserializePage(pageNode);
				if (page != null)
					pages.Add(page);
			}

			return pages;
		}

		private Page DeserializePage(XmlNode node)
		{
			if (node.Name != "page" || node.Attributes["path"] == null || string.IsNullOrEmpty(node.Attributes["path"].Value))
				return null;

			Page page = new Page(Guid.NewGuid(), (node.Attributes["name"] != null ? node.Attributes["name"].Value : node.Attributes["path"].Value), node.Attributes["path"].Value);
			foreach (XmlNode childNode in node.ChildNodes)
			{
				if (childNode.Name == "constraints")
					DeserializeConstraints(page, childNode);
				else if (childNode.Name == "defaults")
					DeserializeDefaults(page, childNode);
				else if (childNode.Name == "contentFragments")
					DeserializeContentFragments(page, childNode);
			}

			return page;
		}

		private void DeserializeConstraints(Page page, XmlNode node)
		{
			foreach (XmlNode constaintNode in node.ChildNodes)
			{
				if (constaintNode.Name == "constraint")
				{
					string token = constaintNode.Attributes["token"] == null ? null : constaintNode.Attributes["token"].Value;
					string pattern = constaintNode.Attributes["pattern"] == null ? null : constaintNode.Attributes["pattern"].Value;

					if (!string.IsNullOrEmpty(token) && !string.IsNullOrEmpty(pattern))
						page.PathParameterContraints[token] = pattern;
				}
			}
		}

		private void DeserializeDefaults(Page page, XmlNode node)
		{
			foreach (XmlNode defaultNode in node.ChildNodes)
			{
				if (defaultNode.Name == "default")
				{
					string token = defaultNode.Attributes["token"] == null ? null : defaultNode.Attributes["token"].Value;
					string value = defaultNode.Attributes["value"] == null ? null : defaultNode.Attributes["value"].Value;

					if (!string.IsNullOrEmpty(token) && !string.IsNullOrEmpty(value))
						page.PathParameterDefaults[token] = value;
				}
			}
		}

		private void DeserializeContentFragments(Page page, XmlNode node)
		{
			foreach (XmlNode ccfNode in node.ChildNodes)
			{
				if (ccfNode.Name == "contentFragment")
				{
					string instanceIdentifierString = ccfNode.Attributes["instanceIdentifier"] == null ? null : ccfNode.Attributes["instanceIdentifier"].Value;
					string configuration = ccfNode.Attributes["configuration"] == null ? string.Empty : ccfNode.Attributes["configuration"].Value;
					bool showHeader = ccfNode.Attributes["showHeader"] == null ? true : string.Compare(ccfNode.Attributes["showHeader"].Value, "false", StringComparison.OrdinalIgnoreCase) != 0;
					string cssClassAddition = ccfNode.Attributes["cssClassAddition"] == null ? string.Empty : ccfNode.Attributes["cssClassAddition"].Value;

					Guid instanceIdentifier;
					if (Guid.TryParse(instanceIdentifierString, out instanceIdentifier))
					{
						page.ContentFragments.Add(new ConfiguredContentFragment
						{
							PageId = page.Id,
							HostId = Guid.NewGuid(),
							Configuration = configuration,
							InstanceId = instanceIdentifier,
							ShowHeader = showHeader,
							CssClassAddition = cssClassAddition
						});
					}
				}
			}
		}

		#endregion
	}
}
