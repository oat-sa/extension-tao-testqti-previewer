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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test runner proxy for the QTI test previewer
 *
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
define([
    'core/promiseQueue',
    'core/request',
    'util/url',
], function (promiseQueue, request, urlUtil) {
    'use strict';

    const serviceControllerInit = 'TestPreviewer';
    const serviceControllerGetItem = 'Previewer';

    const serviceExtension = 'taoQtiTestPreviewer';
    /**
     * QTI proxy definition
     * Related to remote services calls
     * @type {Object}
     */
    return {
        name: 'qtiTestPreviewerProxy',

        /**
         * Installs the proxy
         */
        install: function install() {
            /**
             * A promise queue to ensure requests run sequentially
             */
            this.queue = promiseQueue();
        },
        /**
         * Initializes the proxy
         * @param {Object} configs - configuration from proxy
         * @param {String} testUri - The identifier of the test
         * @returns {Promise} - Returns a promise. The proxy will be fully initialized on resolve.
         *                      Any error will be provided if rejected.
         */
        init: function init(configs, { testUri }) {
            return request( {
                url: urlUtil.route('init', serviceControllerInit, serviceExtension),
                data: { testUri }
            })
            .then(response => response.data);
        },

        /**
         * Uninstalls the proxy
         * @returns {Promise} - Returns a promise. The proxy will be fully uninstalled on resolve.
         *                      Any error will be provided if rejected.
         */
        destroy: function destroy() {
            // no request, just a resources cleaning
            this.queue = null;

            // the method must return a promise
            return Promise.resolve();
        },

        /**
         * Gets an item definition by its URI, also gets its current state
         * @param {String} itemUri - The URI of the item to get
         * @returns {Promise} - Returns a promise. The item data will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        getItem: function getItem(itemUri) {
            return request({
                url: urlUtil.route('getItem', serviceControllerGetItem, serviceExtension),
                data: { serviceCallId: 'previewer', itemUri }
            });
        }
    };
});
