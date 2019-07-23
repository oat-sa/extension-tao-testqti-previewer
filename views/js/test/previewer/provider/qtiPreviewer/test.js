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
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'taoTests/runner/areaBroker',
    'taoTests/runner/proxy',
    'taoTests/runner/runner',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/provider/qtiPreviewer',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'tpl!taoQtiTestPreviewer/previewer/provider/item/tpl/item',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (
    $,
    areaBrokerFactory,
    proxyFactory,
    runnerFactory,
    previewerFactory,
    previewerProvider,
    itemData,
    layoutTpl
) {
    'use strict';

    const runnerConfig = {
        serviceCallId: 'foo',
        provider: {
            runner: 'qtiPreviewer'
        },
        providers: {
            proxy: {
                id: 'qtiItemPreviewProxy',
                module: 'taoQtiTestPreviewer/previewer/proxy/item',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'proxy'
            },
            communicator: {
                id: 'request',
                module: 'core/communicator/request',
                bundle: 'loader/vendor.min',
                category: 'communicator'
            },
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        },
        options: {}
    };

    const extendedProvider = Object.assign({
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
        loadProxy() {
            const {proxyProvider, serviceCallId, bootstrap, timeout} = this.getConfig();
            return proxyFactory(proxyProvider || 'qtiItemPreviewerProxy', {serviceCallId, bootstrap, timeout});
        }
    }, previewerProvider);

    runnerFactory.registerProvider('qtiPreviewer', extendedProvider);

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function () {
        $.mockjax.clear();
    });

    QUnit.module('API');

    QUnit.test('module', assert => {
        const ready = assert.async();
        assert.expect(3);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });

        assert.equal(typeof previewerProvider, 'object', 'The module exposes an object');
        assert.equal(previewerProvider.name, 'qtiPreviewer', 'The provider has the expected name');

        previewerFactory('#fixture-api', runnerConfig)
            .on('ready', runner => {
                assert.ok(true, 'The provider works with the runner');
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.cases.init([
        {title: 'loadTestStore'},
        {title: 'install'},
        {title: 'init'},
        {title: 'render'},
        {title: 'loadItem'},
        {title: 'renderItem'},
        {title: 'unloadItem'},
        {title: 'destroy'}
    ]).test('provider API ', (data, assert) => {
        assert.equal(typeof previewerProvider[data.title], 'function', `The provider expose a ${data.title} function`);
    });

    QUnit.module('UI');

    QUnit.test('render / destroy ', assert => {
        const ready = assert.async();
        assert.expect(12);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });

        previewerFactory('#fixture-render', runnerConfig)
            .on('ready', runner => {
                const areaBroker = runner.getAreaBroker();
                Promise.resolve()
                    .then(() => {
                        const $container = areaBroker.getContainer();
                        assert.equal($container.length, 1, 'The container exists');
                        assert.equal(areaBroker.getContentArea().length, 1, 'The content area exists');
                        assert.equal(areaBroker.getToolboxArea().length, 1, 'The toolbox area exists');
                        assert.equal(areaBroker.getNavigationArea().length, 1, 'The navigation area exists');
                        assert.equal(areaBroker.getControlArea().length, 1, 'The control area exists');
                        assert.equal(areaBroker.getArea('actionsBar').length, 1, 'The actionsBar area exists');
                        assert.equal(areaBroker.getPanelArea().length, 1, 'The panel area exists');
                        assert.equal(areaBroker.getHeaderArea().length, 1, 'The header area exists');
                        assert.equal(areaBroker.getArea('context').length, 1, 'The context area exists');
                        assert.equal(areaBroker.getArea('contentWrapper').length, 1, 'The contentWrapper area exists');
                        return runner.destroy();
                    })
                    .then(() => {
                        const $container = areaBroker.getContainer();
                        assert.equal($container.length, 1, 'The container still exists');
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .after('destroy', () => {
                assert.equal($('#fixture-render').children().length, 0, 'The container has been cleaned');
                ready();
            });
    });

    QUnit.module('behavior');

    QUnit.test('install', assert => {
        const ready = assert.async();
        assert.expect(2);
        const config = Object.assign({}, runnerConfig);
        config.options = {
            plugins: {
                close: {
                    foo: 'bar'
                }
            }
        };
        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });
        previewerFactory('#fixture-install', config)
            .on('ready', function (runner) {
                const plugin = runner.getPlugin('close');

                assert.equal(typeof plugin, 'object', 'The plugin exists');
                assert.deepEqual(plugin.getConfig(), config.options.plugins.close, 'The plugin received the config');

                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.test('init', assert => {
        const ready = assert.async();
        assert.expect(11);
        const config = Object.assign({}, runnerConfig);
        config.options = {
            plugins: {
                close: {
                    foo: 'bar'
                }
            }
        };
        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });
        $.mockjax({
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        });
        previewerFactory('#fixture-init', config)
            .on('ready', function (runner) {
                Promise.resolve()
                    .then(() => Promise.all([
                        new Promise(resolve => {
                            runner.on('enabletools.test', () => {
                                assert.ok(true, 'Event enabletools has been triggered');
                                resolve();
                            });
                        }),
                        new Promise(resolve => {
                            runner.on('enablenav.test', () => {
                                assert.ok(true, 'Event enablenav has been triggered');
                                resolve();
                            });
                        }),
                        runner.loadItem('foo')
                    ]))
                    .then(() => {
                        runner.off('.test');
                        const promises = Promise.all([
                            new Promise(resolve => {
                                runner.on('enableitem.test', () => {
                                    assert.ok(true, 'Event enableitem has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('enablenav.test', () => {
                                    assert.ok(true, 'Event enablenav has been triggered');
                                    resolve();
                                });
                            })
                        ]);
                        runner.trigger('resumeitem');
                        return promises;
                    })
                    .then(() => {
                        runner.off('.test');
                        const promises = new Promise(resolve => {
                            runner.on('disabletools.test', () => {
                                assert.ok(true, 'Event disabletools has been triggered');
                                resolve();
                            });
                        });
                        runner.trigger('disableitem');
                        return promises;
                    })
                    .then(() => {
                        runner.off('.test');
                        const promises = new Promise(resolve => {
                            runner.on('enabletools.test', () => {
                                assert.ok(true, 'Event enabletools has been triggered');
                                resolve();
                            });
                        });
                        runner.trigger('enableitem');
                        return promises;
                    })
                    .then(() => {
                        runner.off('.test');
                        const promises = Promise.all([
                            new Promise(resolve => {
                                runner.on('disabletools.test', () => {
                                    assert.ok(true, 'Event disabletools has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('enablenav.test', () => {
                                    assert.ok(true, 'Event enablenav has been triggered');
                                    resolve();
                                });
                            })
                        ]);
                        runner.trigger('error');
                        return promises;
                    })
                    .then(() => {
                        runner.off('.test');
                        const promises = Promise.all([
                            new Promise(resolve => {
                                runner.on('disablenav.test', () => {
                                    assert.ok(true, 'Event disablenav has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('disabletools.test', () => {
                                    assert.ok(true, 'Event disabletools has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('flush.test', () => {
                                    assert.ok(true, 'Event flush has been triggered');
                                    resolve();
                                });
                            })
                        ]);
                        runner.trigger('finish');
                        return promises;
                    })
                    .catch(err => {
                        assert.ok(false, err);
                    });
            })
            .on('destroy', ready);
    });

    QUnit.cases.init([{
        title: 'itemData in init',
        mock: {
            url: '/init*',
            responseText: {
                success: true,
                itemIdentifier: 'item-1',
                itemData: {
                    content: {
                        type: 'qti',
                        data: itemData
                    },
                    baseUrl: '',
                    state: {}
                }
            }
        }
    }, {
        title: 'itemRef in init',
        mock: [{
            url: '/init*',
            responseText: {
                success: true,
                itemIdentifier: 'item-2'
            }
        }, {
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        }]
    }, {
        title: 'manual load',
        itemIdentifier: 'item-3',
        mock: [{
            url: '/init*',
            responseText: {
                success: true
            }
        }, {
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        }]
    }]).test('render item ', (data, assert) => {
        const ready = assert.async();
        const $container = $('#fixture-item');
        const serviceCallId = 'previewer';
        const config = Object.assign({}, runnerConfig);
        config.serviceCallId = serviceCallId;

        assert.expect(5);

        $.mockjax(data.mock);

        previewerFactory($container, config)
            .on('error', function (err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function (runner) {
                Promise
                    .resolve()
                    .then(() => new Promise(resolve => {
                        runner
                            .off('.test')
                            .after('renderitem.test', function () {
                                assert.ok(true, 'The previewer has been rendered');
                                resolve();
                            });
                    }))
                    .then(() => {
                        runner.off('.test');
                        const promises = Promise.all([
                            new Promise(resolve => {
                                runner.on('beforeunloaditem.test', () => {
                                    assert.ok(true, 'Event beforeunloaditem has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('disablenav.test', () => {
                                    assert.ok(true, 'Event disablenav has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('disabletools.test', () => {
                                    assert.ok(true, 'Event disabletools has been triggered');
                                    resolve();
                                });
                            }),
                            new Promise(resolve => {
                                runner.on('unloaditem.test', () => {
                                    assert.ok(true, 'Event unloaditem has been triggered');
                                    resolve();
                                });
                            }),
                            runner.unloadItem()
                        ]);
                        return promises;
                    })
                    .catch(err => {
                        assert.ok(false, err);
                    })
                    .then(() => runner.destroy());

                if (data.itemIdentifier) {
                    runner.loadItem(data.itemIdentifier);
                }
            })
            .on('destroy', ready);
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', assert => {
        const ready = assert.async();
        const $container = $('#visual-test');
        const itemRef = 'item-1';

        assert.expect(1);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });
        $.mockjax({
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        });

        previewerFactory($container, runnerConfig)
            .on('error', function (err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function (runner) {
                runner
                    .after('renderitem.runnerComponent', function () {
                        assert.ok(true, 'The previewer has been rendered');
                        ready();
                    })
                    .loadItem(itemRef);
            });
    });

});
