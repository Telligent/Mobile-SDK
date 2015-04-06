using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.PushNotifications.Model;

namespace Telligent.Evolution.Mobile.PushNotifications.Implementations
{
	internal class DeviceRegistrationService : Telligent.Evolution.Mobile.PushNotifications.Services.IDeviceRegistrationService
	{
		private readonly Telligent.Evolution.Mobile.PushNotifications.Services.IDeviceRegistrationDataService DataService;

		internal DeviceRegistrationService(Telligent.Evolution.Mobile.PushNotifications.Services.IDeviceRegistrationDataService dataService)
		{
			DataService = dataService;
		}

		#region IDeviceRegistrationService Members

		public IEnumerable<UserDeviceRegistration> GetDevices(int userId)
		{
			return DataService.GetDevices(userId);
		}

		public void RegisterDevice(int userId, string token, DeviceType type)
		{
			DataService.RegisterDevice(userId, token, type);
		}

		public void UnregisterDevice(int? userId, string token, DeviceType type)
		{
			DataService.UnregisterDevice(userId, token, type);
		}

		public void UnregisterDevice(string token)
		{
			DataService.UnregisterDevice(null, token, null);
		}

		#endregion
	}
}
