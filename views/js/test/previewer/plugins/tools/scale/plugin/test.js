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
    'ui/hider',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/scale',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (
    $,
    _,
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
                module: 'taoQtiTestPreviewer/previewer/plugins/tools/scale/scale',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'tools'
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

    QUnit.module('API');

    QUnit.test('module', assert => {
        const ready = assert.async();
        assert.expect(3);

        previewerFactory(runnerConfig, $('#fixture-api'))
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
    ]).test('plugin API ', function (data, assert) {
        const ready = assert.async();
        assert.expect(1);

        previewerFactory(runnerConfig, $('#fixture-api'))
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
        options: {
            readOnly: false
        }
    }, {
        title: 'read only',
        options: {
            readOnly: true
        }
    }]).test('render / destroy ', (data, assert) => {
        const ready = assert.async();
        assert.expect(4);

        const config = Object.assign({}, runnerConfig);
        config.options = data.options;

        previewerFactory(config, $('#fixture-render'))
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('scale');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 1, 'The devices selector has been inserted');
                        assert.equal($devicesSelector.hasClass('disabled'), true, 'The button has been rendered disabled');
                        assert.equal(hider.isHidden($devicesSelector), data.options.readOnly, 'The button state is aligned to the config');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('enable / disable', assert => {
        const ready = assert.async();
        assert.expect(7);

        previewerFactory(runnerConfig, $('#fixture-enable'))
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('scale');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 1, 'The devices selector has been inserted');
                        assert.equal($devicesSelector.hasClass('disabled'), true, 'The devices selector has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.hasClass('disabled'), false, 'The devices selector has been enabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('disablenav', resolve)
                                .trigger('disablenav');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.hasClass('disabled'), true, 'The devices selector has been disabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('enablenav', resolve)
                                .trigger('enablenav');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.hasClass('disabled'), false, 'The devices selector has been enabled');
                        return plugin.disable();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.hasClass('disabled'), true, 'The devices selector has been disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('show / hide', assert => {
        const ready = assert.async();
        assert.expect(10);

        previewerFactory(runnerConfig, $('#fixture-show'))
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('scale');
                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            runner
                                .after('renderitem', resolve)
                                .loadItem('item-1');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 1, 'The devices selector has been inserted');
                        assert.equal($devicesSelector.hasClass('disabled'), false, 'The devices selector is enabled');
                        assert.ok(!hider.isHidden($devicesSelector), 'The devices selector is visible');
                        return plugin.hide();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 1, 'The devices selector has been inserted');
                        assert.equal($devicesSelector.hasClass('disabled'), false, 'The devices selector is enabled');
                        assert.ok(hider.isHidden($devicesSelector), 'The devices selector is hidden');
                        return plugin.show();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 1, 'The devices selector has been inserted');
                        assert.equal($devicesSelector.hasClass('disabled'), false, 'The devices selector is enabled');
                        assert.ok(!hider.isHidden($devicesSelector), 'The devices selector is visible');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 0, 'The trigger button has been removed');
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

    QUnit.test('scale', assert => {
        const ready = assert.async();
        assert.expect(32);

        previewerFactory(runnerConfig, $('#fixture-show'))
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('scale');
                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            runner
                                .after('renderitem', resolve)
                                .loadItem('item-1');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 1, 'The devices selector has been inserted');
                        assert.equal($devicesSelector.hasClass('disabled'), false, 'The devices selector is enabled');
                        assert.ok(!hider.isHidden($devicesSelector), 'The devices selector is visible');
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return new Promise(function(resolve) {
                            const $container = areaBroker.getHeaderArea();
                            const $devicesSelector = $container.find('.devices-selector');
                            runner
                                .on('resizeitem.testselector', function(size, orientation, type) {
                                    assert.equal(type, 'desktop', 'Device type has been changed');
                                    assert.notEqual(size, null, 'Device data is provided');
                                    assert.equal(size.width, 1920, 'Device width is provided');
                                    assert.equal(size.height, 1080, 'Device height is provided');
                                    assert.equal(orientation, null, 'No orientation for desktop device');
                                    resolve();
                                });
                            $devicesSelector.find('.type-selector select').val('desktop').change();
                        });
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return new Promise(function(resolve) {
                            const $container = areaBroker.getHeaderArea();
                            const $devicesSelector = $container.find('.devices-selector');
                            runner
                                .on('resizeitem.testselector', function(size, orientation, type) {
                                    assert.equal(type, 'standard', 'Device type has been changed');
                                    assert.equal(size, null, 'No device data is provided');
                                    assert.equal(orientation, null, 'No orientation for desktop device');
                                    resolve();
                                });
                            $devicesSelector.find('.type-selector select').val('standard').change();
                        });
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return new Promise(function(resolve) {
                            const $container = areaBroker.getHeaderArea();
                            const $devicesSelector = $container.find('.devices-selector');
                            runner
                                .on('resizeitem.testselector', function(size, orientation, type) {
                                    assert.equal(type, 'mobile', 'Device type has been changed');
                                    assert.notEqual(size, null, 'Device data is provided');
                                    assert.equal(size.width, 960, 'Device width is provided');
                                    assert.equal(size.height, 600, 'Device height is provided');
                                    assert.equal(orientation, 'landscape', 'Orientation for mobile device');
                                    resolve();
                                });
                            $devicesSelector.find('.type-selector select').val('mobile').change();
                        });
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return new Promise(function(resolve) {
                            const $container = areaBroker.getHeaderArea();
                            const $devicesSelector = $container.find('.devices-selector');
                            runner
                                .on('resizeitem.testselector', function(size, orientation, type) {
                                    assert.equal(type, 'mobile', 'Device type is still the same');
                                    assert.notEqual(size, null, 'Device data is provided');
                                    assert.equal(size.width, 960, 'Device width is provided');
                                    assert.equal(size.height, 600, 'Device height is provided');
                                    assert.equal(orientation, 'portrait', 'Orientation for mobile device');
                                    resolve();
                                });
                            $devicesSelector.find('.orientation-selector select').val('portrait').change();
                        });
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return new Promise(function(resolve) {
                            const $container = areaBroker.getHeaderArea();
                            const $devicesSelector = $container.find('.devices-selector');
                            runner
                                .on('resizeitem.testselector', function(size, orientation, type) {
                                    assert.equal(type, 'mobile', 'Device type is still the same');
                                    assert.notEqual(size, null, 'Device data is provided');
                                    assert.equal(size.width, 966, 'Device width is provided');
                                    assert.equal(size.height, 604, 'Device height is provided');
                                    assert.equal(orientation, 'portrait', 'Orientation for mobile device');
                                    resolve();
                                });
                            $devicesSelector.find('.mobile-selector select').val('9805d9753ad08c7630a9ee5418aa6c6c').change();
                        });
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return new Promise(function(resolve) {
                            runner
                                .on('resizeitem.testselector', function(size, orientation, type) {
                                    assert.equal(type, 'mobile', 'Device type is still the same');
                                    assert.notEqual(size, null, 'Device data is provided');
                                    assert.equal(size.width, 966, 'Device width is provided');
                                    assert.equal(size.height, 604, 'Device height is provided');
                                    assert.equal(orientation, 'portrait', 'Orientation for mobile device');
                                    resolve();
                                });
                            $(window).trigger('resize');
                        });
                    })
                    .then(function () {
                        runner.off('.testselector');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getHeaderArea();
                        const $devicesSelector = $container.find('.devices-selector');
                        assert.equal($devicesSelector.length, 0, 'The trigger button has been removed');
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

    QUnit.test('Visual test', assert => {
        const ready = assert.async();
        const $container = $('#visual-test');
        const itemRef = 'item-1';
        assert.expect(1);

        previewerFactory(runnerConfig, $container)
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
