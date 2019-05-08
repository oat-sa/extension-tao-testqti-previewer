/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define([
    'lodash',
    'core/promise'
],
function (_, Promise) {
    'use strict';

    var defaults = {
        initialToken: null
    };

    /**
     * Stores the security token queue
     * @param {Object} [options]
     * @param {String} [options.maxSize]
     * @param {String} [options.tokenTimeLimit]
     * @param {String} [options.initialToken]
     * @returns {tokenHandler}
     */
    return function tokenHandlerFactory(options) {

        var tokenStore;

        // Convert legacy parameter:
        if (_.isString(options)) {
            options = {
                initialToken: options
            };
        }
        options = _.defaults({}, options, defaults);

        // Initialise storage for tokens:
        tokenStore = options.initialToken;

        return {
            /**
             * Gets the next security token from the token queue
             * If none are available, it can check the ClientConfig (once only per page)
             * Once the token is got, it is erased from the store (because they are single-use by design)
             *
             * @returns {Promise<String>} the token value
             */
            getToken: function getToken() {
                return Promise.resolve(tokenStore);
            },

            /**
             * Adds a new security token to the token queue
             * Internally, old tokens are deleted to keep queue within maximum pool size
             * @param {String} newToken
             * @returns {Promise<Boolean>} - resolves true if successful
             */
            setToken: function setToken(newToken) {
                tokenStore = newToken;
                return Promise.resolve(true);
            },

            /**
             * Extracts tokens from the Client Config which should be received on every page load
             * @returns {Promise<Boolean>} - resolves true when completed
             */
            getClientConfigTokens: function getClientConfigTokens() {
                return Promise.resolve(true);
            },

            /**
             * Clears the token store
             * @returns {Promise<Boolean>} - resolves to true when cleared
             */
            clearStore: function clearStore() {
                tokenStore = null;
                return Promise.resolve(true);
            },

            /**
             * Getter for the current queue length
             * @returns {Promise<Integer>}
             */
            getQueueLength: function getQueueLength() {
                return Promise.resolve(tokenStore !== null ? 1 : 0);
            },

            /**
             * Setter for maximum pool size
             * @param {Integer} size
             */
            setMaxSize: function setMaxSize(size) {
            }
        };
    };
});
