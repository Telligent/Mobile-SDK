using System;
using System.Collections.Generic;
using Telligent.Evolution.Mobile.App.Services;
using Telligent.Evolution.Mobile.PushNotifications.Implementations;
using Telligent.Evolution.Mobile.PushNotifications.Services;

namespace Telligent.Evolution.Mobile
{
	internal static class ServiceLocator
	{
		private static object _lockObject = new object();
		private static Dictionary<Type, object> _instances = null;

		public static T Get<T>()
		{
			EnsureInitialized();
			return (T)_instances[typeof(T)];
		}

		public static void EnsureInitialized()
		{
			if (_instances == null)
				lock (_lockObject)
					if (_instances == null)
					{
						var localInstances = new Dictionary<Type, object>();

						var embeddedResources = new EmbeddedResourceService();
						var dataService = new DeviceRegistrationDataService(embeddedResources);

						localInstances[typeof(IEmbeddedResourceService)] = embeddedResources;
						localInstances[typeof(IDeviceRegistrationDataService)] = dataService;
						localInstances[typeof(IDeviceRegistrationService)] = new DeviceRegistrationService(dataService);
						localInstances[typeof(Telligent.Evolution.Mobile.App.Services.IAppDataService)] = new Telligent.Evolution.Mobile.App.Implementations.AppDataService();
						
						_instances = localInstances;
					}
		}
	}
}
