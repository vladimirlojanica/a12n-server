import { HalResource } from 'hal-types';
import { getSetting } from '../../server-settings';
import { User, PrincipalStats } from '../../principal/types';

export default (version: string, authenticatedUser: User, isAdmin: boolean, stats: PrincipalStats) => {

  const result: HalResource = {
    _links: {
      'self': { href: '/', title: 'Home' },
      'authenticated-as': { href: '/user/' + authenticatedUser.id, title: authenticatedUser.nickname },
      'change-password': { href: '/changepassword', title: 'Change password' },

      'app-collection': { href: '/app', title: 'List of apps'},
      'user-collection': { href: '/user', title: 'List of users'},
      'group-collection': { href: '/group', title: 'List of groups'},
      'logout': {
        href: '/logout',
        title: 'Log out',
      },
      'privilege-collection': {
        href: '/privilege',
        title: 'List of available privileges',
      },


      'authorize' : { href: '/authorize', title: 'OAuth2 authorize endpoint', type: 'text/html' },
      'token': {
        href: '/token',
        title: 'OAuth2 Token Endpoint',
        hints: {
          allow: ['POST'],
        }
      },
      'introspect' : {
        href: '/introspect',
        title: 'OAuth2 Introspection Endpoint',
        hints: {
          allow: ['POST'],
        }
      },

      'schema-collection': {
        href: '/schema',
        title: 'List of JSON schemas for this API'
      },

      'oauth_server_metadata_uri' : {
        href: '/.well-known/oauth-authorization-server',
        title: 'OAuth 2.0 Authorization Server Metadata'
      }
    },
    version: version,
    stats
  };

  if (getSetting('registration.enabled')) {
    result._links.registration = {
      href: '/register',
      title: 'Create a new user account',
      type: 'text/html'
    };
  }

  if (isAdmin) {
    result._links['exchange-one-time-token'] = {
      href: '/exchange-one-time-token',
      title: 'Exchange a one-time token for a Access and Refresh token',
    };
  }

  return result;

};
