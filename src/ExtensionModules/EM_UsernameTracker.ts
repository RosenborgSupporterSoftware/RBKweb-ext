import { SettingType } from "../Configuration/SettingType";
import { RBKwebPageType } from "../Context/RBKwebPageType";
import { ConfigBuilder } from "../Configuration/ConfigBuilder";
import { ConfigurationOptionVisibility } from "../Configuration/ConfigurationOptionVisibility";
import { ModuleConfiguration } from "../Configuration/ModuleConfiguration";
import { PostInfo } from "../Utility/PostInfo";
import { Log } from "../Utility/Log";
import { PageContext } from "../Context/PageContext";
import { ModuleBase } from "./ModuleBase";

/**
 * EM_UsernameTracker - Extension module for RBKweb.
 */

export class UsernameTracker extends ModuleBase {
    readonly name : string = "UsernameTracker";

    pageTypesToRunOn: Array<RBKwebPageType> = [
        RBKwebPageType.RBKweb_FORUM_POSTLIST
    ];

    configSpec = () =>
        ConfigBuilder
            .Define()
            .EnabledByDefault()
            .WithExtensionModuleName(this.name)
            .WithDescription('Varsle endrede brukernavn')
            .WithDisplayName(this.name)
            .WithConfigOption(opt =>
                opt
                    .WithSettingName("knownUsernames")
                    .WithSettingType(SettingType.text)
                    .WithVisibility(ConfigurationOptionVisibility.Never)
                    .WithDefaultValue('')
            )
            .Build();

    names: Map<number, string>;

    init = (config: ModuleConfiguration) => {
        super.init(config);
        try {
            var dictstr = this._cfg.GetSetting("knownUsernames") as string;
            var dict = JSON.parse(dictstr || "{}");
            this.names = new Map<number, string>();
            Object.keys(dict).forEach(function(key: string, idx: number, array: string[]) {
                this.names.set(+key, dict[key]);
            }.bind(this));
            var logmsg = this.name + ": tracking " + this.names.size + " account names (" + dictstr.length + " bytes)";
            Log.Debug(logmsg);
            if (dictstr.length > 7500) Log.Warning("UsernameTracker closing in on 8K limit!");
        } catch (e) {
            console.error(this.name + " init failed: " + e.message);
            Log.Error(this.name + " init failed: " + e.message);
        }
        return null;
    }

    posts: Array<PostInfo>;

    preprocess = (context: PageContext) => {
        try {
            this.posts = context.RUSKPage.items as Array<PostInfo>;
            var updated = false;
            this.posts.forEach(function(post: PostInfo) {
                var username = post.posterNickname;
                var userid = post.posterid;
                if (userid != -1 && !this.names[userid]) {
                    this.names[userid] = username;
                    updated = true;
                }
                post.rowElement.querySelectorAll("table tr td span.genmed b").forEach(function(elt: Element, key: number, parent: NodeListOf<Element>) {
                    var bold = elt as HTMLElement;
                    if (bold.textContent.endsWith(" wrote:") || bold.textContent.endsWith(" skrev:")) {
                        var match = bold.textContent.match(/(.*) (wrote|skrev):/);
                        if (match) {
                            var table = elt.closest('table') as HTMLTableElement;
                            table.classList.add("RUSKQuote");
                            var username = match[1];
                            var verb = match[2];
                            this.names.forEach(function(value: string, key: number, map: Map<number, string>) {
                                if (username == value) table.classList.add("RUSKQuoteUser-" + key);
                            }.bind(this));
                        }
                    }
                }.bind(this));
            }.bind(this));
            if (updated) { // we found some new names
                this.storeKnownUsernames();
            }
        } catch (e) {
            console.error("error finding usernames: " + e.message + " - " + e.stack);
        }
    }

    execute = () => {
        try {
            this.posts.forEach(function(post: PostInfo) {
                var username = post.posterNickname;
                var userid = post.posterid;
                if (userid == -1) return;
                if (this.names[userid] && this.names[userid] != username) {
                    var spanelt = post.rowElement.querySelector('td span.name') as HTMLSpanElement;
                    spanelt.insertAdjacentHTML('afterend', '<span class="nav aka' + userid +
                                                '"><br>aka&nbsp;' + this.names[userid] +
                                                '&nbsp;<a title="Thank you RUSK!" class="aka'+userid+'">' +
                                                '<img src="' + chrome.runtime.getURL("/img/checkmark.png") +
                                                '" width="12" height="12" border="0" valign="bottom" /></a></span>');
                    var anchor = (spanelt.closest("td") as HTMLTableCellElement).querySelector('a.aka' + userid) as HTMLAnchorElement;
                    anchor.addEventListener('click', function() {
                        var table = spanelt.closest('table') as HTMLTableElement;
                        table.querySelectorAll('span.aka' + userid).forEach(function(elt: HTMLSpanElement) {
                            elt.style.display = 'none';
                        }.bind(this));
                        this.names[userid] = username;
                        this.storeKnownUsernames();
                    }.bind(this));
                }
            }.bind(this));
        } catch (e) {
            console.error("exception: " + e.message + " - " + e.stack);
        }
    }

    private storeKnownUsernames(): void {
        var dictstr = JSON.stringify(this.names);
        this._cfg.ChangeSetting("knownUsernames", dictstr);
    }
}