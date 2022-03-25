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
 * Copyright (c) 2020-2022 (original work) Open Assessment Technologies SA ;
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
    'taoQtiTest/runner/helpers/map',
    'taoQtiTestPreviewer/previewer/proxy/itemDataHandlers'
], function (promiseQueue, request, urlUtil, mapHelper, itemDataHandlers) {
    'use strict';

    const serviceControllerInit = 'TestPreviewer';
    const serviceControllerGetItem = 'Previewer';

    const serviceExtension = 'taoQtiTestPreviewer';

    /**
     * The possible states of the test session,
     * coming from the test context
     * (this state comes from the backend)
     */
    const testSessionStates = Object.freeze({
        initial: 0,
        interacting: 1,
        modalFeedback: 2,
        suspended: 3,
        closed: 4
    });
    /**
     * The possible states of an item session,
     * coming from the test context
     * (this state comes from the backend)
     */
    const itemSessionStates = Object.freeze({
        initial: 0,
        interacting: 1,
        modalFeedback: 2,
        suspended: 3,
        closed: 4,
        solution: 5,
        review: 6
    });

    /**
     * Updates testContext with item data
     * @param {Object} testMap
     * @param {Number} position - item position
     * @param {Object} testContext
     * @param {Array} presetMap
     */
    function updateTestContextWithItem(testMap, position, testContext, presetMap) {
        const jump = mapHelper.getJump(testMap, position);
        const item = mapHelper.getItemAt(testMap, position);
        if (!item) {
            return;
        }
        testContext.testPartId = jump.part;
        testContext.sectionId = jump.section;
        testContext.itemIdentifier = jump.identifier;
        testContext.itemSessionState = itemSessionStates.initial;
        testContext.options = createContextOptions(item, presetMap);
        testContext.allowSkipping = item.allowSkipping;
    }

    /**
     * Convert preset categories to context.options
     * @param {Object} item
     * @param {Array} presetMap
     * @returns {Object} options
     */
    function createContextOptions(item, presetMap) {
        const options = {};
        presetMap.forEach(category => {
            const pluginId = Object.keys(category)[0];
            const categoryId = category[pluginId];
            if (item.categories.includes(categoryId)) {
                options[pluginId] = true;
            }
        });
        return options;
    }

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
        install() {
            /**
             * A promise queue to ensure requests run sequentially
             */
            this.queue = promiseQueue();
        },
        /**
         * Initializes the proxy
         * @param {Object} configs - configuration from proxy
         * @param {String} configs.options.testUri - The identifier of the test
         * @returns {Promise} - Returns a promise. The proxy will be fully initialized on resolve.
         *                      Any error will be provided if rejected.
         */
        init(configs) {
            this.itemStore = {};
            return request({
                url: urlUtil.route('init', serviceControllerInit, serviceExtension),
                data: { testUri: configs.options.testUri },
                noToken: true
            }).then(response => {
                const data = response.data;
                //the received map is not complete and should be "built"
                this.builtTestMap = mapHelper.reindex(data.testMap);
                this.presetMap = data.presetMap || [];
                delete data.presetMap;
                const firstJump = this.builtTestMap.jumps[0] || {};
                const firstItem = mapHelper.getItemAt(this.builtTestMap, 0);
                data.testContext = {
                    itemIdentifier: firstJump.identifier,
                    itemPosition: 0,
                    itemSessionState: 0,
                    testPartId: firstJump.part,
                    sectionId: firstJump.section,
                    canMoveBackward: true,
                    state: testSessionStates.interacting,
                    attempt: 1,
                    options: createContextOptions(firstItem, this.presetMap),
                    allowSkipping: firstItem.allowSkipping
                };
                return data;
            });
        },

        /**
         * Uninstalls the proxy
         * @returns {Promise} - Returns a promise. The proxy will be fully uninstalled on resolve.
         *                      Any error will be provided if rejected.
         */
        destroy() {
            // no request, just a resources cleaning
            this.queue = null;

            if (this.itemStore) {
                this.itemStore = null;
            }

            // the method must return a promise
            return Promise.resolve();
        },

        /**
         * Gets an item definition by its URI, also gets its current state
         * @param {String} itemIdentifier - The URI of the item to get
         * @returns {Promise} - Returns a promise. The item data will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        getItem(itemIdentifier) {
            if (itemIdentifier in this.itemStore) {
                // Load item from store
                return Promise.resolve(this.itemStore[itemIdentifier]);
            } else {
                // Load from server; Store in store
                const { uri } = mapHelper.getItem(this.builtTestMap, itemIdentifier) || {};
                if (!uri) {
                    throw new Error(`There is no item ${itemIdentifier} in the testMap!`);
                }
                return request({
                    url: urlUtil.route('getItem', serviceControllerGetItem, serviceExtension),
                    data: { serviceCallId: 'previewer', itemUri: uri },
                    noToken: true
                })
                    .then(data => {
                        data.itemData = data.content;
                        data.itemIdentifier = data.content.data.identifier;
                        data.itemState = {};
                        this.itemStore[itemIdentifier] = data;
                        return data;
                    })
                    .then(itemData => itemDataHandlers(itemData));
            }
        },

        /**
         * Call action on the test
         * @param {string} itemIdentifier - the current item
         * @param {string} action - the action id
         * @param {Object} params
         * @returns {Promise} resolves with the response
         */
        callItemAction(itemIdentifier, action, params = {}) {
            const dataHolder = this.getDataHolder();
            const testContext = dataHolder.get('testContext');
            const testMap = dataHolder.get('testMap');
            const actions = {
                //simulate backend move action
                move: () => {
                    if (params.direction === 'next' || action === 'skip') {
                        if (params.scope === 'testPart') {
                            const testPartPosition = testMap.parts[testContext.testPartId].position;
                            const nextPartsSorted = Object.values(testMap.parts)
                                .filter(p => p.position > testPartPosition)
                                .sort((a, b) => a.position - b.position);
                            if (nextPartsSorted.length === 0) {
                                testContext.state = testSessionStates.closed;
                            } else {
                                testContext.itemPosition = Math.min(
                                    testMap.stats.total - 1,
                                    nextPartsSorted[0].position
                                );
                            }
                        } else {
                            if (testContext.itemPosition + 1 >= testMap.stats.total) {
                                testContext.state = testSessionStates.closed;
                            } else {
                                testContext.itemPosition = Math.min(
                                    testMap.stats.total - 1,
                                    testContext.itemPosition + 1
                                );
                            }
                        }
                    }
                    if (params.direction === 'previous') {
                        testContext.itemPosition = Math.max(0, testContext.itemPosition - 1);
                    }
                    if (params.direction === 'jump' && params.ref >= 0) {
                        testContext.itemPosition = params.ref;
                    }

                    updateTestContextWithItem(testMap, testContext.itemPosition, testContext, this.presetMap);

                    return { testContext, testMap };
                },

                flagItem: () => Promise.resolve()
            };
            actions.skip = actions.move;

            if (params.itemState) {
                // store itemState in itemStore
                this.itemStore[itemIdentifier].itemState = params.itemState;
            }

            if (typeof actions[action] === 'function') {
                return actions[action]();
            }
        },

        /**
         * Calls an action related to the test
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        callTestAction() {
            // the method must return a promise
            return Promise.resolve();
        }
    };
});
