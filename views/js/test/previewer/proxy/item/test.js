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
 * Copyright (c) 2018-2022 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'util/url',
    'core/communicator',
    'taoTests/runner/proxy',
    'taoQtiTestPreviewer/previewer/proxy/item',
    'lib/jquery.mockjax/jquery.mockjax'
], function ($, _, urlUtil, communicatorFactory, proxyFactory, itemProxy) {
    'use strict';

    QUnit.module('itemProxy');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(() => $.mockjax.clear());

    QUnit.test('module', assert => {
        assert.expect(6);
        assert.equal(typeof itemProxy, 'object', 'The itemProxy module exposes an object');
        assert.equal(typeof proxyFactory, 'function', 'The proxyFactory module exposes a function');
        assert.equal(
            typeof proxyFactory.registerProvider,
            'function',
            'The proxyFactory module exposes a registerProvider method'
        );
        assert.equal(
            typeof proxyFactory.getProvider,
            'function',
            'The proxyFactory module exposes a getProvider method'
        );

        proxyFactory.registerProvider('itemProxy', itemProxy);

        assert.equal(
            typeof proxyFactory('itemProxy'),
            'object',
            'The proxyFactory factory has registered the itemProxy definition and produces an instance'
        );
        assert.notStrictEqual(
            proxyFactory('itemProxy'),
            proxyFactory('itemProxy'),
            'The proxyFactory factory provides a different instance of itemProxy on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'install' },
            { title: 'init' },
            { title: 'destroy' },
            { title: 'callTestAction' },
            { title: 'getItem' },
            { title: 'submitItem' },
            { title: 'callItemAction' }
        ])
        .test('proxy API ', (data, assert) => {
            assert.expect(1);
            assert.equal(
                typeof itemProxy[data.title],
                'function',
                `The itemProxy definition exposes a "${data.title}" function`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'success',
                response: {
                    success: true
                },
                ajaxSuccess: true,
                success: true
            },
            {
                title: 'failing data',
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: true,
                success: false
            },
            {
                title: 'failing request',
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('itemProxy.init ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                serviceCallId: 'foo',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            const expectedUrl = urlUtil.route(
                'init',
                initConfig.bootstrap.serviceController,
                initConfig.bootstrap.serviceExtension,
                {
                    serviceCallId: initConfig.serviceCallId
                }
            );

            assert.expect(6);

            proxyFactory.registerProvider('itemProxy', itemProxy);

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                responseText: caseData.response,
                response(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            const proxy = proxyFactory('itemProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    proxy.on('init', (promise, config) => {
                        assert.ok(true, 'The proxy has fired the "init" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "init" event'
                        );
                        assert.equal(
                            config,
                            initConfig,
                            'The proxy has provided the config object through the "init" event'
                        );
                    });

                    const result = proxy.init();

                    assert.equal(typeof result, 'object', 'The proxy.init method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(() => {
                    ready();
                });
        });

    QUnit.test('itemProxy.destroy', assert => {
        const ready = assert.async();
        const initConfig = {
            serviceCallId: 'foo',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension'
            }
        };

        assert.expect(5);

        proxyFactory.registerProvider('itemProxy', itemProxy);

        $.mockjax([
            {
                url: '/init*',
                status: 200,
                responseText: {
                    success: true
                }
            },
            {
                url: '/*',
                status: 500,
                response() {
                    assert.ok(false, 'The proxy must not use an ajax request to destroy the instance!');
                }
            }
        ]);

        const proxy = proxyFactory('itemProxy', initConfig);

        proxy
            .install()
            .then(() => {
                return proxy.init();
            })
            .then(() => {
                proxy.on('destroy', promise => {
                    assert.ok(true, 'The proxyFactory has fired the "destroy" event');
                    assert.equal(
                        typeof promise,
                        'object',
                        'The proxy has provided the promise through the "destroy" event'
                    );
                });

                const result = proxy.destroy();

                assert.equal(typeof result, 'object', 'The proxy.destroy method has returned a promise');

                return result;
            })
            .then(() => {
                assert.ok(true, 'The proxy has resolved the promise provided by the "destroy" method!');

                proxy
                    .getTestContext()
                    .then(() => {
                        assert.ok(false, 'The proxy must be initialized');
                        ready();
                    })
                    .catch(() => {
                        assert.ok(true, 'The proxy must be initialized');
                        ready();
                    });
            })
            .catch(() => {
                assert.ok(false, 'The proxy should not fail!');
                ready();
            });
    });

    QUnit.cases
        .init([
            {
                title: 'success',
                action: 'move',
                params: {
                    type: 'forward'
                },
                response: {
                    success: true
                },
                ajaxSuccess: true,
                success: true
            },
            {
                title: 'failing data',
                action: 'move',
                params: {
                    type: 'forward'
                },
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: true,
                success: false
            },
            {
                title: 'failing request',
                action: 'move',
                params: {
                    type: 'forward'
                },
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('itemProxy.callTestAction ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                serviceCallId: 'foo',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            const expectedUrl = urlUtil.route(
                caseData.action,
                initConfig.bootstrap.serviceController,
                initConfig.bootstrap.serviceExtension,
                {
                    serviceCallId: initConfig.serviceCallId
                }
            );

            assert.expect(8);

            proxyFactory.registerProvider('itemProxy', itemProxy);

            $.mockjax([
                {
                    url: '/init*',
                    status: 200,
                    responseText: {
                        success: true
                    }
                },
                {
                    url: '/*',
                    status: caseData.ajaxSuccess ? 200 : 500,
                    responseText: caseData.response,
                    response(settings) {
                        assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                    }
                }
            ]);

            const proxy = proxyFactory('itemProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    return proxy.callTestAction(caseData.action, caseData.params);
                })
                .then(() => {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(() => {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(() => {
                    return proxy.init();
                })
                .then(() => {
                    proxy.on('callTestAction', (promise, action, params) => {
                        assert.ok(true, 'The proxy has fired the "callTestAction" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "callTestAction" event'
                        );
                        assert.equal(
                            action,
                            caseData.action,
                            'The proxy has provided the action through the "callTestAction" event'
                        );
                        assert.deepEqual(
                            params,
                            caseData.params,
                            'The proxy has provided the params through the "callTestAction" event'
                        );
                    });

                    const result = proxy.callTestAction(caseData.action, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.callTestAction method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(() => {
                    ready();
                });
        });

    QUnit.cases
        .init([
            {
                title: 'success',
                uri: 'http://tao.dev/mockItemDefinition#123',
                response: {
                    itemData: {
                        interactions: [{}]
                    },
                    itemState: {
                        response: [{}]
                    },
                    success: true
                },
                ajaxSuccess: true,
                success: true
            },
            {
                title: 'failing data',
                uri: 'http://tao.dev/mockItemDefinition#123',
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: true,
                success: false
            },
            {
                title: 'failing request',
                uri: 'http://tao.dev/mockItemDefinition#123',
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('itemProxy.getItem ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                serviceCallId: 'foo',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            const expectedUrl = urlUtil.route(
                'getItem',
                initConfig.bootstrap.serviceController,
                initConfig.bootstrap.serviceExtension,
                {
                    serviceCallId: initConfig.serviceCallId,
                    itemUri: caseData.uri
                }
            );

            assert.expect(7);

            proxyFactory.registerProvider('itemProxy', itemProxy);

            $.mockjax([
                {
                    url: '/init*',
                    status: 200,
                    responseText: {
                        success: true
                    }
                },
                {
                    url: '/*',
                    status: caseData.ajaxSuccess ? 200 : 500,
                    responseText: caseData.response,
                    response(settings) {
                        assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                    }
                }
            ]);

            const proxy = proxyFactory('itemProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    return proxy.getItem(caseData.uri);
                })
                .then(() => {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(() => {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(() => {
                    return proxy.init();
                })
                .then(() => {
                    proxy.on('getItem', (promise, uri) => {
                        assert.ok(true, 'The proxy has fired the "getItem" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "getItem" event'
                        );
                        assert.equal(uri, caseData.uri, 'The proxy has provided the URI through the "getItem" event');
                    });

                    const result = proxy.getItem(caseData.uri);

                    assert.equal(typeof result, 'object', 'The proxy.getItem method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(() => {
                    ready();
                });
        });

    QUnit.cases
        .init([
            {
                title: 'success',
                uri: 'http://tao.dev/mockItemDefinition#123',
                itemState: { response: [{}] },
                itemResponse: { response: [{}] },
                response: {
                    success: true
                },
                ajaxSuccess: true,
                success: true
            },
            {
                title: 'failing data',
                uri: 'http://tao.dev/mockItemDefinition#123',
                itemState: { response: [{}] },
                itemResponse: { response: [{}] },
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: true,
                success: false
            },
            {
                title: 'failing request',
                uri: 'http://tao.dev/mockItemDefinition#123',
                itemState: { response: [{}] },
                itemResponse: { response: [{}] },
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('itemProxy.submitItem ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                serviceCallId: 'foo',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            const expectedUrl = urlUtil.route(
                'submitItem',
                initConfig.bootstrap.serviceController,
                initConfig.bootstrap.serviceExtension,
                {
                    serviceCallId: initConfig.serviceCallId,
                    itemUri: caseData.uri
                }
            );

            assert.expect(9);

            proxyFactory.registerProvider('itemProxy', itemProxy);

            $.mockjax([
                {
                    url: '/init*',
                    status: 200,
                    responseText: {
                        success: true
                    }
                },
                {
                    url: '/*',
                    status: caseData.ajaxSuccess ? 200 : 500,
                    responseText: caseData.response,
                    response(settings) {
                        assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                    }
                }
            ]);

            const proxy = proxyFactory('itemProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    return proxy.submitItem(caseData.uri, caseData.itemState, caseData.itemResponse);
                })
                .then(() => {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(() => {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(() => {
                    return proxy.init();
                })
                .then(() => {
                    proxy.on('submitItem', (promise, uri, state, response) => {
                        assert.ok(true, 'The proxy has fired the "submitItem" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "submitItem" event'
                        );
                        assert.equal(
                            uri,
                            caseData.uri,
                            'The proxy has provided the URI through the "submitItem" event'
                        );
                        assert.deepEqual(
                            state,
                            caseData.itemState,
                            'The proxy has provided the state through the "submitItem" event'
                        );
                        assert.deepEqual(
                            response,
                            caseData.itemResponse,
                            'The proxy has provided the response through the "submitItem" event'
                        );
                    });

                    const result = proxy.submitItem(caseData.uri, caseData.itemState, caseData.itemResponse);

                    assert.equal(typeof result, 'object', 'The proxy.submitItem method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(() => {
                    ready();
                });
        });

    QUnit.cases
        .init([
            {
                title: 'success',
                uri: 'http://tao.dev/mockItemDefinition#123',
                action: 'comment',
                params: {
                    text: 'lorem ipsum'
                },
                response: {
                    success: true
                },
                ajaxSuccess: true,
                success: true
            },
            {
                title: 'failing data',
                uri: 'http://tao.dev/mockItemDefinition#123',
                action: 'comment',
                params: {
                    text: 'lorem ipsum'
                },
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: true,
                success: false
            },
            {
                title: 'failing request',
                uri: 'http://tao.dev/mockItemDefinition#123',
                action: 'comment',
                params: {
                    text: 'lorem ipsum'
                },
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('itemProxy.callItemAction ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                serviceCallId: 'foo',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            const expectedUrl = urlUtil.route(
                caseData.action,
                initConfig.bootstrap.serviceController,
                initConfig.bootstrap.serviceExtension,
                {
                    serviceCallId: initConfig.serviceCallId,
                    itemUri: caseData.uri
                }
            );

            assert.expect(9);

            proxyFactory.registerProvider('itemProxy', itemProxy);

            $.mockjax([
                {
                    url: '/init*',
                    status: 200,
                    responseText: {
                        success: true
                    }
                },
                {
                    url: '/*',
                    status: caseData.ajaxSuccess ? 200 : 500,
                    responseText: caseData.response,
                    response(settings) {
                        assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                    }
                }
            ]);

            const proxy = proxyFactory('itemProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    return proxy.callItemAction(caseData.uri, caseData.action, caseData.params);
                })
                .then(() => {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(() => {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(() => {
                    return proxy.init();
                })
                .then(() => {
                    proxy.on('callItemAction', (promise, uri, action, params) => {
                        assert.ok(true, 'The proxy has fired the "callItemAction" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "callItemAction" event'
                        );
                        assert.equal(
                            uri,
                            caseData.uri,
                            'The proxy has provided the URI through the "callItemAction" event'
                        );
                        assert.equal(
                            action,
                            caseData.action,
                            'The proxy has provided the action through the "callItemAction" event'
                        );
                        assert.deepEqual(
                            params,
                            caseData.params,
                            'The proxy has provided the params through the "callItemAction" event'
                        );
                    });

                    const result = proxy.callItemAction(caseData.uri, caseData.action, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.callItemAction method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(() => {
                    ready();
                });
        });
});
