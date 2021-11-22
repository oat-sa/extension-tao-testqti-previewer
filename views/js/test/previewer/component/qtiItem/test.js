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
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'taoQtiTestPreviewer/previewer/component/qtiItem',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function($, _, qtiItemPreviewerFactory, itemData) {
    'use strict';

    QUnit.module('API');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.test('module', assert =>  {
        const ready = assert.async();
        const config = {};

        const previewer1 = qtiItemPreviewerFactory('#fixture-api', config);
        const previewer2 = qtiItemPreviewerFactory('#fixture-api', config);

        assert.expect(4);
        $.mockjax({
            url: '/*',
            responseText: {
                success: true
            }
        });
        assert.equal(typeof qtiItemPreviewerFactory, 'function', 'The previewer module exposes a function');
        assert.equal(typeof previewer1, 'object', 'The previewer factory returns an object');
        assert.equal(typeof previewer2, 'object', 'The previewer factory returns an object');
        assert.notEqual(previewer1, previewer2, 'The previewer factory returns a different instance on each call');

        Promise.all([
            new Promise(resolve => previewer1.on('ready', resolve) ),
            new Promise(resolve => previewer2.on('ready', resolve) )
        ]).catch(function(err) {
            assert.pushResult({
                result: false,
                message: err
            });
        }).then( ready );
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
    }]).test('render item ', (data, assert) =>  {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const config = {
            itemUri: data.itemIdentifier
        };

        assert.expect(1);

        $.mockjax(data.mock);

        qtiItemPreviewerFactory($container, config)
            .on('error', function (err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner.after('renderitem', function() {
                    assert.ok(true, 'The previewer has been rendered');
                    ready();
                });
            });
    });

    QUnit.test('config', assert => {
        const ready = assert.async();
        const config = {
            view: 'scorer',
            readOnly: true,
            fullPage: true,
            pluginsOptions: true,
            hideActionBars: true,
        };

        const previewerWithOptions = qtiItemPreviewerFactory('#fixture-api', config);
        const previewerWithoutOptions = qtiItemPreviewerFactory('#fixture-api', {});

        assert.expect(2);
        $.mockjax({
            url: '/*',
            responseText: {
                success: true
            }
        });

        Promise.all([
            new Promise(resolve => previewerWithOptions.on('ready', runner => resolve(runner))),
            new Promise(resolve => previewerWithoutOptions.on('ready', runner => resolve(runner))),
        ]).catch(function(err) {
            assert.pushResult({
                result: false,
                message: err
            });
        }).then(([runnerWithOptions, runnerWithoutOptions]) => {
            assert.deepEqual(
                runnerWithOptions.getConfig().options,
                { view: 'scorer', readOnly: true, fullPage: true, plugins: true, hideActionBars: true },
                'The previewer factory set options using config'
            );
            assert.deepEqual(
                runnerWithoutOptions.getConfig().options,
                { view: undefined,readOnly: undefined, fullPage: undefined, plugins: undefined, hideActionBars: undefined },
                'The previewer factory leave options undefined if config empty'
            );

            ready();
        });
    });

    QUnit.test('destroy', assert =>  {
        const ready = assert.async();
        const $container = $('#fixture-destroy');
        const config = {};

        assert.expect(2);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });

        qtiItemPreviewerFactory($container, config)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                assert.equal($container.children().length, 1, 'The previewer has been rendered');
                runner.destroy();
            })
            .after('destroy', function() {
                assert.equal($container.children().length, 0, 'The previewer has been destroyed');
                ready();
            });
    });

    QUnit.test('asset manager configuration', assert => {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const config = {};

        assert.expect(3);

        const mockItemData = {
            content: {
                type: 'qti',
                data: itemData,
                assets: {
                    img: {
                        'hello.jpg': 'hello.jpg?a=b'
                    }
                }
            },
            baseUrl: 'www.hello.org',
            state: {}
        };
        $.mockjax({
            url: '/init*',
            responseText: {
                success: true,
                itemIdentifier: 'item-1',
                itemData: mockItemData
            }
        });

        qtiItemPreviewerFactory($container, config)
            .on('error', function (err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function (runner) {
                runner.after('renderitem', function () {
                    assert.ok(runner.itemRunner.assetManager, 'Created assetManager');
                    assert.equal(
                        runner.itemRunner.assetManager.getData('baseUrl'),
                        mockItemData.baseUrl,
                        'Configured assetManager with "baseUrl" from itemData'
                    );
                    assert.deepEqual(
                        runner.itemRunner.assetManager.getData('assets'),
                        mockItemData.content.assets,
                        'Configured assetManager with "assets" from itemData'
                    );

                    ready();
                });
            });
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        const ready = assert.async();
        const $container = $('#visual-test');
        const config = {
            itemUri: 'item-1'
        };

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
        $.mockjax({
            url: '/submitItem*',
            responseText: {
                success: true,
                displayFeedbacks: false,
                itemSession: {
                    SCORE: {
                        base: {
                            float: 0
                        }
                    }
                }
            }
        });

        qtiItemPreviewerFactory($container, config)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner.after('renderitem.runnerComponent', function() {
                    assert.ok(true, 'The previewer has been rendered');
                    ready();
                });
            });
    });
});
