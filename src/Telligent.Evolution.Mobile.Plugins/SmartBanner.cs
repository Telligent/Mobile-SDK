using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Telligent.Evolution.Extensibility.Version1;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.DynamicConfiguration.Components;
using Telligent.Evolution.Mobile.App.Services;

namespace Telligent.Evolution.Mobile.App
{
	public class SmartBanner : IPlugin, IScriptedContentFragmentFactoryDefaultProvider, IInstallablePlugin, IPluginGroup
	{
		private readonly Guid _identifier = new Guid("990036ddffb648179b061510d9820ff4");

		#region IPlugin Members

		public string Description
		{
			get { return "Enables the widget APIs and default widgets to enable showing a smart banner to alert users to download an available app."; }
		}

		public void Initialize()
		{
		}

		public string Name
		{
			get { return "Mobile App Smart Banner"; }
		}

		#endregion

		#region IScriptedContentFragmentFactoryDefaultProvider Members

		public Guid ScriptedContentFragmentFactoryDefaultIdentifier
		{
			get { return _identifier; }
		}

		#endregion

		#region IInstallablePlugin Members

		public void Install(Version lastInstalledVersion)
		{
			// This installs the factory defaults into the appropriate location when the plugin
			// is deployed and enabled.
			Func<string, Guid> getGuidFromResourceString = delegate(string inGuid)
			{
				Guid outGuid;
				if (Guid.TryParse(inGuid.StartsWith("_") ? inGuid.Substring(1) : inGuid, out outGuid))
					return outGuid;
				return Guid.Empty;
			};

			var assembly = GetType().Assembly;
			var assemblyNameLength = assembly.GetName().Name.Length + 1;
			foreach (string resourceName in assembly.GetManifestResourceNames())
			{
				string[] path = resourceName.Substring(assemblyNameLength).Split('.');
				if (path.Length > 3
					&& string.Compare(path[0], "filestorage", true) == 0
					&& string.Compare(path[1], "defaultwidgets", true) == 0
					&& getGuidFromResourceString(path[2]) == ScriptedContentFragmentFactoryDefaultIdentifier)
				{
					Guid instanceId = getGuidFromResourceString(path[3]);
					Guid themeId = getGuidFromResourceString(path[4]);
					if (path.Length > 5
						&& themeId != Guid.Empty
						&& instanceId != Guid.Empty
						&& (string.Compare(path[4], "xml", true) != 0 || path.Length > 5))
						FactoryDefaultScriptedContentFragmentProviderFiles.AddUpdateSupplementaryFile(
							 this,
							 instanceId,
							 themeId.ToString("N"),
							 string.Join(".", path.ToList().GetRange(5, path.Length - 5)),
							 assembly.GetManifestResourceStream(resourceName)
							 );
					else if (path.Length > 4
						&& instanceId != Guid.Empty
						&& (string.Compare(path[4], "xml", true) != 0 || path.Length > 5))
						FactoryDefaultScriptedContentFragmentProviderFiles.AddUpdateSupplementaryFile(
							 this,
							 instanceId,
							 string.Join(".", path.ToList().GetRange(4, path.Length - 4)),
							 assembly.GetManifestResourceStream(resourceName)
							 );
					else if (string.Compare(path[path.Length - 1], "xml", true) == 0)
						FactoryDefaultScriptedContentFragmentProviderFiles.AddUpdateDefinitionFile(
							this,
							string.Join(".", path.ToList().GetRange(3, path.Length - 3)),
							assembly.GetManifestResourceStream(resourceName)
							);
				}
			}
		}

		public void Uninstall()
		{
			FactoryDefaultScriptedContentFragmentProviderFiles.DeleteAllFiles(this);
		}

		public Version Version
		{
			get { return GetType().Assembly.GetName().Version; }
		}

		#endregion

		#region IPluginGroup Members

		public IEnumerable<Type> Plugins
		{
			get 
			{
				return new Type[] {
					typeof(MobileApplicationScriptedContentFragmentExtension)
				};
			}
		}

		#endregion
	}
}
