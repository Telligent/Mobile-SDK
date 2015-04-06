using System;
using System.Collections.Generic;
using System.Web.Routing;

namespace Telligent.Evolution.Mobile.Web.Model
{
	internal class User
	{
		private object _syncRoot = new object();

		internal User(string userName, string languageKey)
		{
			UserName = userName;
			LanguageKey = languageKey;
		}

		public string UserName { get; private set; }
		public string LanguageKey { get; private set; }
		internal string OAuthToken { get; set; }
		internal string RefreshToken { get; set; }
		internal DateTime TokenExpiresUtc { get; set; }
		private bool IsEmpty { get; set; }

		internal string Serialize()
		{
			// TOOD: Should this be signed to ensure the username/language key aren't tampered with?

			return string.Concat(
				Uri.EscapeDataString(UserName),
				"?",
				Uri.EscapeDataString(LanguageKey),
				"?",
				Uri.EscapeDataString(OAuthToken),
				"?",
				Uri.EscapeDataString(RefreshToken),
				"?",
				Uri.EscapeDataString(TokenExpiresUtc.Ticks.ToString())
				);
		}

		static internal User Deserialize(string serializedUser)
		{
			string[] data = serializedUser.Split('?');
			if (data.Length != 5)
				return null;

			var user = new User(Uri.UnescapeDataString(data[0]), Uri.UnescapeDataString(data[1]));
			user.OAuthToken = Uri.UnescapeDataString(data[2]);
			user.RefreshToken = Uri.UnescapeDataString(data[3]);
			user.TokenExpiresUtc = new DateTime(long.Parse(Uri.UnescapeDataString(data[4])));

			return user;
		}

		internal static User Empty = new User(null, null);

		internal object SyncRoot { get { return _syncRoot; } }

		public override bool Equals(object obj)
		{
			var user2 = obj as User;
			if (user2 == null)
				return false;

			return user2.UserName == null && this.UserName == null;
		}

		public override int GetHashCode()
		{
			return base.GetHashCode();
		}
	}
}