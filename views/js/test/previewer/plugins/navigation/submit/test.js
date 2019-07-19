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
    'lodash',
    'i18n',
    'ui/hider',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (
    $,
    _,
    __,
    hider,
    previewerFactory,
    pluginFactory,
    itemData
) {
    'use strict';

    const runnerConfig = {
        serviceCallId : 'foo',
        providers : {
            runner: {
                id: 'qtiItemPreviewer',
                module: 'taoQtiTestPreviewer/previewer/provider/item/item',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'runner'
            },
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
                module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'navigation'
            }]
        },
        options : {}
    };

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Mock the queries
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

    QUnit.module('API');

    QUnit.test('module', assert =>  {
        const ready = assert.async();
        assert.expect(3);

        previewerFactory('#fixture-api', runnerConfig)
            .on('ready', function (runner) {
                assert.equal(typeof pluginFactory, 'function', 'The module exposes a function');
                assert.equal(typeof pluginFactory(runner), 'object', 'The factory produces an instance');
                assert.notStrictEqual(pluginFactory(runner), pluginFactory(runner), 'The factory provides a different instance on each call');
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'render'},
        {title: 'finish'},
        {title: 'destroy'},
        {title: 'trigger'},
        {title: 'getTestRunner'},
        {title: 'getAreaBroker'},
        {title: 'getConfig'},
        {title: 'setConfig'},
        {title: 'getState'},
        {title: 'setState'},
        {title: 'show'},
        {title: 'hide'},
        {title: 'enable'},
        {title: 'disable'}
    ]).test('plugin API ', (data, assert) =>  {
        const ready = assert.async();
        assert.expect(1);
        previewerFactory('#fixture-api', runnerConfig)
            .on('ready', function (runner) {
                const plugin = pluginFactory(runner);
                assert.equal(typeof plugin[data.title], 'function', `The instances expose a ${data.title} function`);
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.module('UI');

    QUnit.cases.init([{
        title: 'interactive',
        expectedTitle: __('Submit and show the result'),
        expectedText: __('Submit'),
        expectedIcon: 'forward',
        options: {
            readOnly: false
        }
    }, {
        title: 'read only',
        expectedTitle: __('Submit and show the result'),
        expectedText: __('Submit'),
        expectedIcon: 'forward',
        options: {
            readOnly: true
        }
    }, {
        title: 'custom',
        expectedTitle: 'Foo',
        expectedText: 'Bar',
        expectedIcon: 'globe',
        options: {
            readOnly: false,
            plugins: {
                submit: {
                    submitTitle: 'Foo',
                    submitText: 'Bar',
                    submitIcon: 'globe'
                }
            }
        }
    }]).test('render / destroy ', (data, assert) =>  {
        const ready = assert.async();
        assert.expect(11);

        const config = Object.assign({}, runnerConfig);
        config.options = data.options;

        previewerFactory('#fixture-render', config)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.attr('title').trim(), data.expectedTitle, 'The button has the expected title');
                        assert.equal($button.text().trim(), data.expectedText, 'The button has the expected text');
                        assert.equal($button.find(`.icon-${data.expectedIcon}`).length, 1, 'The button has the expected icon');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        assert.equal(hider.isHidden($button), config.options.readOnly, 'The button state is aligned to the config');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('enable / disable', assert =>  {
        const ready = assert.async();
        assert.expect(11);

        previewerFactory('#fixture-enable', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('disablenav', resolve)
                                .trigger('disablenav');
                        });
                    })
                    .then(function () {
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('enablenav', resolve)
                                .trigger('enablenav');
                        });
                    })
                    .then(function () {
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return plugin.disable();
                    })
                    .then(function () {
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('show / hide', assert =>  {
        const ready = assert.async();
        assert.expect(17);

        previewerFactory('#fixture-show', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            runner
                                .after('renderitem', resolve)
                                .loadItem('item-1');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            const $navigation = areaBroker.getNavigationArea();
                            const $button = $navigation.find('[data-control="submit"]');
                            runner.after('scoreitem', function() {
                                assert.ok('The score is submitted');
                                resolve();
                            });
                            $button.click();
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(!hider.isHidden($closer), 'The console closer is visible');
                        assert.ok(!hider.isHidden($console), 'The console is visible');
                        return plugin.hide();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.ok(hider.isHidden($button), 'The button has been hidden');
                        assert.ok(hider.isHidden($closer), 'The console closer has been hidden');
                        assert.ok(hider.isHidden($console), 'The console has been hidden');
                        return plugin.show();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(hider.isHidden($closer), 'The console closer is still hidden');
                        assert.ok(hider.isHidden($console), 'The console is still hidden');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.module('behavior');

    QUnit.test('submit', assert =>  {
        const ready = assert.async();
        assert.expect(14);
        previewerFactory('#fixture-show', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            runner
                                .after('renderitem', resolve)
                                .loadItem('item-1');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            const $navigation = areaBroker.getNavigationArea();
                            const $button = $navigation.find('[data-control="submit"]');
                            runner.after('scoreitem', function() {
                                assert.ok('The score is submitted');
                                resolve();
                            });
                            $button.click();
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(!hider.isHidden($closer), 'The console closer is visible');
                        assert.ok(!hider.isHidden($console), 'The console is visible');
                        $closer.click();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(hider.isHidden($closer), 'The console closer is hidden');
                        assert.ok(hider.isHidden($console), 'The console is hidden');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getContainer();
                        const $navigation = areaBroker.getNavigationArea();
                        const $button = $navigation.find('[data-control="submit"]');
                        const $closer = $navigation.find('.preview-console-closer');
                        const $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });



    QUnit.module('Visual');

    QUnit.test('Visual test', assert =>  {
        const ready = assert.async();
        const $container = $('#visual-test');
        const itemRef = 'item-1';

        assert.expect(1);

        previewerFactory($container, runnerConfig)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner
                    .after('renderitem.runnerComponent', function() {
                        assert.ok(true, 'The previewer has been rendered');
                        ready();
                    })
                    .loadItem(itemRef);
            });
    });

});
