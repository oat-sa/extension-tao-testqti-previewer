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
 * Copyright (c) 2018-2024 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test runner provider for the QTI item previewer
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'ui/feedback',
    'taoTests/runner/areaBroker',
    'taoTests/runner/testStore',
    'taoTests/runner/proxy',
    'taoQtiTest/runner/ui/toolbox/toolbox',
    'taoQtiItem/runner/qtiItemRunner',
    'taoQtiTest/runner/config/assetManager',
    'taoItems/assets/strategies',
    'taoQtiItem/qtiCommonRenderer/helpers/container',
    'tpl!taoQtiTestPreviewer/previewer/provider/item/tpl/item'
], function (
    $,
    _,
    __,
    feedback,
    areaBrokerFactory,
    testStoreFactory,
    proxyFactory,
    toolboxFactory,
    qtiItemRunner,
    assetManagerFactory,
    assetStrategies,
    containerHelper,
    layoutTpl
) {
    'use strict';

    //the asset strategies
    const assetManager = assetManagerFactory();
    assetManager.prependStrategy(assetStrategies.taomedia);

    //store the current execution context of the common renderer (preview)
    let _$previousContext = null;
    function setContext($context) {
        _$previousContext = containerHelper.getContext();
        containerHelper.setContext($context);
    }
    function restoreContext() {
        containerHelper.setContext(_$previousContext);
        _$previousContext = null;
    }
    /**
     * A Test runner provider to be registered against the runner
     */
    return {
        //provider name
        name: 'qtiItemPreviewer',

        /**
         * Initialize and load the area broker with a correct mapping
         * @returns {areaBroker}
         */
        loadAreaBroker() {
            const $layout = $(layoutTpl());

            return areaBrokerFactory($layout, {
                contentWrapper: $('.content-wrapper', $layout),
                content: $('#qti-content', $layout),
                toolbox: $('.bottom-action-bar .tools-box', $layout),
                navigation: $('.bottom-action-bar .navi-box-list', $layout),
                control: $('.top-action-bar .control-box', $layout),
                actionsBar: $('.bottom-action-bar .control-box', $layout),
                panel: $('.test-sidebar-left', $layout),
                header: $('.top-action-bar .tools-box', $layout),
                context: $('.top-action-bar .navi-box-list', $layout)
            });
        },

        /**
         * Initialize and load the test runner proxy
         * @returns {proxy}
         */
        loadProxy() {
            const { proxyProvider, serviceCallId, bootstrap, timeout } = this.getConfig();
            return proxyFactory(proxyProvider || 'qtiItemPreviewerProxy', { serviceCallId, bootstrap, timeout });
        },

        /**
         * Initialize and load the test store
         * @returns {testStore}
         */
        loadTestStore() {
            const config = this.getConfig();

            //the test run needs to be identified uniquely
            const identifier = config.serviceCallId || `test-${Date.now()}`;
            return testStoreFactory(identifier);
        },

        /**
         * Installation of the provider, called during test runner init phase.
         */
        install() {
            const { plugins } = this.getConfig().options;
            if (plugins) {
                _.forEach(this.getPlugins(), plugin => {
                    if (_.isPlainObject(plugin) && _.isFunction(plugin.setConfig)) {
                        const config = plugins[plugin.getName()];
                        if (_.isPlainObject(config)) {
                            plugin.setConfig(config);
                        }
                    }
                });
            }
        },

        /**
         * Initialization of the provider, called during test runner init phase.
         *
         * We install behaviors during this phase (ie. even handlers)
         * and we call proxy.init.
         *
         * @this {runner} the runner context, not the provider
         * @returns {Promise} to chain proxy.init
         */
        init() {
            const dataHolder = this.getDataHolder();
            const areaBroker = this.getAreaBroker();

            areaBroker.setComponent('toolbox', toolboxFactory());
            areaBroker.getToolbox().init();

            /*
             * Install behavior on events
             */
            this.on('submititem', () => {
                const itemState = this.itemRunner.getState();
                const itemResponses = this.itemRunner.getResponses();

                this.trigger('disabletools disablenav');
                this.trigger('submitresponse', itemResponses, itemState);

                return this.getProxy()
                    .submitItem(dataHolder.get('itemIdentifier'), itemState, itemResponses)
                    .then(response => {
                        this.trigger('scoreitem', response);
                        this.trigger('enabletools enablenav resumeitem');
                    })
                    .catch(err => {
                        this.trigger('enabletools enablenav');

                        //some server errors are valid, so we don't fail (prevent empty responses)
                        if (err.code === 200) {
                            this.trigger(
                                'alert.submitError',
                                err.message || __('An error occurred during results submission. Please retry.'),
                                () => this.trigger('resumeitem')
                            );
                        }
                    });
            })
                .on('ready', () => {
                    const itemIdentifier = dataHolder.get('itemIdentifier');
                    const itemData = dataHolder.get('itemData');

                    if (itemIdentifier) {
                        if (itemData) {
                            this.renderItem(itemIdentifier, itemData);
                        } else {
                            this.loadItem(itemIdentifier);
                        }
                    }
                })
                .on('loaditem', (itemRef, itemData) => {
                    dataHolder.set('itemIdentifier', itemRef);
                    dataHolder.set('itemData', itemData);
                })
                .on('renderitem', () => {
                    this.trigger('enabletools enablenav');
                })
                .on('resumeitem', () => {
                    this.trigger('enableitem enablenav');
                })
                .on('disableitem', () => {
                    this.trigger('disabletools');
                })
                .on('enableitem', () => {
                    this.trigger('enabletools');
                })
                .on('error', () => {
                    this.trigger('disabletools enablenav');
                })
                .on('finish leave', () => {
                    this.trigger('disablenav disabletools');
                    this.flush();
                })
                .on('flush', () => {
                    this.destroy();
                });

            return this.getProxy()
                .init()
                .then(data => {
                    dataHolder.set('itemIdentifier', data.itemIdentifier);
                    dataHolder.set('itemData', data.itemData);
                });
        },

        /**
         * Rendering phase of the test runner
         *
         * Attach the test runner to the DOM
         *
         * @this {runner} the runner context, not the provider
         */
        render() {
            const config = this.getConfig();
            const areaBroker = this.getAreaBroker();

            config.renderTo.append(areaBroker.getContainer());

            if (config.options.view) {
                areaBroker.getContainer().addClass(`view-${config.options.view}`);
            }

            areaBroker.getToolbox().render(areaBroker.getToolboxArea());
        },

        /**
         * LoadItem phase of the test runner
         *
         * We call the proxy in order to get the item data
         *
         * @this {runner} the runner context, not the provider
         * @param {String} itemIdentifier - The identifier of the item to update
         * @returns {Promise} that calls in parallel the state and the item data
         */
        loadItem(itemIdentifier) {
            return this.getProxy().getItem(itemIdentifier);
        },

        /**
         * RenderItem phase of the test runner
         *
         * Here we initialize the item runner and wrap it's call to the test runner
         *
         * @this {runner} the runner context, not the provider
         * @param {String} itemIdentifier - The identifier of the item to update
         * @param {Object} itemData - The definition data of the item
         * @returns {Promise} resolves when the item is ready
         */
        renderItem(itemIdentifier, itemData) {
            const areaBroker = this.getAreaBroker();
            const options = this.getConfig().options;

            const changeState = () => {
                this.setItemState(itemIdentifier, 'changed', true);
            };

            setContext(areaBroker.getContentArea());

            return new Promise((resolve, reject) => {
                itemData.content = itemData.content || {};

                assetManager.setData('baseUrl', itemData.baseUrl);
                assetManager.setData('assets', itemData.content.assets);

                this.itemRunner = qtiItemRunner(
                    itemData.content.type,
                    itemData.content.data,
                    Object.assign(
                        {
                            assetManager: assetManager
                        },
                        options
                    )
                )
                    .on('error', err => {
                        this.trigger('enablenav');
                        reject(err);
                        feedback().error(
                            __('It seems that there is an error during item preview loading. Please, try again.')
                        );
                    })
                    .on('init', function onItemRunnerInit() {
                        const { state, portableElements } = itemData;
                        this.render(areaBroker.getContentArea(), { state, portableElements });
                    })
                    .on('render', function onItemRunnerRender() {
                        this.on('responsechange', changeState);
                        this.on('statechange', changeState);
                        resolve();
                    })
                    .init();
            });
        },

        /**
         * UnloadItem phase of the test runner
         *
         * Item clean up
         *
         * @this {runner} the runner context, not the provider
         * @returns {Promise} resolves when the item is cleared
         */
        unloadItem() {
            this.trigger('beforeunloaditem disablenav disabletools');

            if (this.itemRunner) {
                return new Promise(resolve => {
                    this.itemRunner.on('clear', resolve).clear();
                });
            }
            return Promise.resolve();
        },

        /**
         * Destroy phase of the test runner
         *
         * Clean up
         *
         * @this {runner} the runner context, not the provider
         */
        destroy() {
            const areaBroker = this.getAreaBroker();

            // prevent the item to be displayed while test runner is destroying
            if (this.itemRunner) {
                this.itemRunner.on('clear', restoreContext).clear();
            }
            this.itemRunner = null;

            if (areaBroker) {
                areaBroker.getToolbox().destroy();
            }
        }
    };
});
