using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Extensibility.Version1;
using Telligent.Evolution.Extensibility.Content.Version1;
using Telligent.DynamicConfiguration.Components;
using Telligent.Evolution.Extensibility.Api.Version1;
using Telligent.Evolution.Extensibility.Api.Entities.Version1;
using Telligent.Evolution.Extensibility.Rest.Version2;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Extensibility.Storage.Version1;
using System.IO;

namespace Telligent.Evolution.Mobile.App
{
	public class MobileAppsFileStore : IPlugin,  ICentralizedFileStore
	{
		#region IPlugin Members

		public string Description
		{
			get { return "Stores data about publically accessible mobile applications."; }
		}

		public void Initialize()
		{
			CentralizedFileStorage.Events.AfterUpdate += Events_AfterUpdate;
			CentralizedFileStorage.Events.AfterDelete += Events_AfterDelete;
		}

		void Events_AfterDelete(CentralizedFileAfterDeleteEventArgs e)
		{
			RemoveAppData(e.FileStoreKey, e.Path, e.FileName);
		}

		void Events_AfterUpdate(CentralizedFileAfterUpdateEventArgs e)
		{
			RemoveAppData(e.FileStoreKey, e.Path, e.FileName);
		}

		public string Name
		{
			get { return "Mobile Applications File Store"; }
		}

		#endregion

		#region ICentralizedFileStore Members

		public string FileStoreKey
		{
			get { return Telligent.Evolution.Mobile.App.Model.AppConstants.AppDataFileStoreKey; }
		}

		#endregion

		private void RemoveAppData(string fileStoreKey, string path, string fileName)
		{
			string[] extensions = {
									  ".apk", ".ipa"
								  };

			if (
				string.IsNullOrEmpty(fileStoreKey)
				|| string.Compare(fileStoreKey, FileStoreKey, true) == 0
				|| (!string.IsNullOrEmpty(fileName) && !extensions.Contains(Path.GetExtension(fileName).ToLowerInvariant()))
				)
				return;

			string deletePath = fileStoreKey;
			if (!string.IsNullOrEmpty(path))
				deletePath = CentralizedFileStorage.MakePath(deletePath, path);

			if (!string.IsNullOrEmpty(fileName))
				deletePath = CentralizedFileStorage.MakePath(deletePath, fileName.Replace(CentralizedFileStorage.DirectorySeparator.ToString(), ""));

			CentralizedFileStorage.GetFileStore(FileStoreKey).Delete(deletePath);

			ServiceLocator.Get<Services.IAppDataService>().ExpireCache();
		}
	}
}
