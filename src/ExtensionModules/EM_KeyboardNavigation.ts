import { ExtensionModule } from "./ExtensionModule";
import { ModuleConfiguration } from "../Configuration/ModuleConfiguration";
import { RBKwebPageType } from "../Context/RBKwebPageType";
import { ConfigBuilder } from "../Configuration/ConfigBuilder";
import { PageContext } from "../Context/PageContext";
import { RUSKUI } from "../UI/RUSKUI";
import { HotkeyAction } from "../Utility/HotkeyAction";
import { Log } from "../Utility/Log";
import { PostInfo } from "../Utility/PostInfo";

export class KeyboardNavigation implements ExtensionModule {

    readonly name = "KeyboardNavigation";
    private _cfg: ModuleConfiguration;
    private _ctx: PageContext;
    private _quickReplyElement: HTMLDivElement;

    private get quickReplyElement(): HTMLDivElement {
        return this._quickReplyElement || (this._quickReplyElement = document.querySelector('div.RUSKDivTextArea'));
    }

    pageTypesToRunOn: Array<RBKwebPageType> = [
        RBKwebPageType.RBKweb_ALL
    ];

    runBefore = [];
    runAfter = [];

    configSpec = () =>
        ConfigBuilder
            .Define()
            .EnabledByDefault()
            .WithExtensionModuleName(this.name)
            .WithDisplayName("Tastaturnavigasjon")
            .WithDescription("Denne modulen gjør det mulig å bevege deg rundt på RBKweb ved hjelp av tastaturet.")
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('NextItem')
                    .WithLabel('Hurtigtast for å gå til neste forum/tråd/innlegg osv.')
                    .WithKeyCombos(['J', '.'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_FORUMLIST, RBKwebPageType.RBKweb_FORUM_TOPICLIST, RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('PrevItem')
                    .WithLabel('Hurtigtast for å gå til forrige forum/tråd/innlegg osv.')
                    .WithKeyCombos(['K', ','])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_FORUMLIST, RBKwebPageType.RBKweb_FORUM_TOPICLIST, RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('NextPage')
                    .WithLabel('Hurtigtast for å gå til neste side med tråder/innlegg')
                    .WithKeyCombos(['Shift J'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_TOPICLIST, RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('PrevPage')
                    .WithLabel('Hurtigtast for å gå til forrige side med tråder/innlegg')
                    .WithKeyCombos(['Shift K'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_TOPICLIST, RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('GoUp')
                    .WithLabel('Gå opp fra innlegg til trådlista, eller trådlista til forumlista')
                    .WithKeyCombos(['H', 'O'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST, RBKwebPageType.RBKweb_FORUM_TOPICLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('EnterSelected')
                    .WithLabel('Gå inn i forum/tråd')
                    .WithKeyCombos(['L', 'Enter'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_FORUMLIST, RBKwebPageType.RBKweb_FORUM_TOPICLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('ForumHome')
                    .WithLabel('Gå til forum-forsiden')
                    .WithKeyCombos(['Ctrl |'])
                    .WithPageTypes([RBKwebPageType.RBKweb_ALL])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('ReplyToSelected')
                    .WithLabel('Svare på valgt innlegg')
                    .WithKeyCombos(['R'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('QuickReply')
                    .WithLabel('Hurtigsvar (inline) på valgt innlegg')
                    .WithKeyCombos(['Shift R'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('NewTopic')
                    .WithLabel('Nytt emne')
                    .WithKeyCombos(['N'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST, RBKwebPageType.RBKweb_FORUM_TOPICLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('EditSelected')
                    .WithLabel('Redigér valgt innlegg')
                    .WithKeyCombos(['E'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('QuoteSelected')
                    .WithLabel('Sitér valgt innlegg')
                    .WithKeyCombos(['Q'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .WithHotkey(hk =>
                hk
                    .WithHotkeyName('GetIpInformation')
                    .WithLabel('Hent IP-informasjon fra valgt innlegg (kun moderatorer)')
                    .WithKeyCombos(['I'])
                    .WithPageTypes([RBKwebPageType.RBKweb_FORUM_POSTLIST])
            )
            .Build();

    init = (cfg: ModuleConfiguration) => {
        this._cfg = cfg;

        let ui = new RUSKUI();
        ui.ExtractHotkeys(cfg);

        return ui;
    }

    preprocess = (ctx: PageContext) => {
        this._ctx = ctx;
    }

    execute = (ctx: PageContext) => {
    }

    invoke = function (cmd: string): boolean {

        let qrFocus = this.quickReplyHasFocus();
        let shouldPreventDefault = false;

        switch (cmd) {
            case "NextItem":
                if (!qrFocus) {
                    this._ctx.RUSKPage.GoToNextItem();
                    shouldPreventDefault = true;
                }
                break;
            case "PrevItem":
                if (!qrFocus) {
                    this._ctx.RUSKPage.GoToPreviousItem();
                    shouldPreventDefault = true;
                }
                break;
            case "NextPage":
                if (!qrFocus) {
                    this._ctx.RUSKPage.GoToNextPage();
                    shouldPreventDefault = true;
                }
                break;
            case "PrevPage":
                if (!qrFocus) {
                    this._ctx.RUSKPage.GoToPreviousPage();
                    shouldPreventDefault = true;
                }
                break;
            case "GoUp":
                if (!qrFocus) {
                    this._ctx.RUSKPage.GoUp();
                    shouldPreventDefault = true;
                }
                break;
            case "EnterSelected":
                if (!qrFocus) {
                    this._ctx.RUSKPage.EnterSelectedItem();
                    shouldPreventDefault = true;
                }
                break;
            case "ForumHome":
                let link = document.querySelector('a.b[href$="forum/"') as HTMLAnchorElement;
                document.location.href = link.href;
                break;
            case "ReplyToSelected":
                if (!qrFocus) {
                    this.replyToSelected();
                    shouldPreventDefault = true;
                }
                break;
            case "QuickReply":
                if (!qrFocus) {
                    this.quickReplyIfEnabled();
                    shouldPreventDefault = true;
                }
                break;
            case "EditSelected":
                if (!qrFocus) {
                    let postInfo = this._ctx.RUSKPage.selectedItem as PostInfo;
                    if (postInfo == null) return;
                    if (!postInfo.editUrl || postInfo.editUrl.length == 0) return;

                    window.location.href = postInfo.editUrl;
                    shouldPreventDefault = true; // Probably not a big deal since we're moving to another page
                }
                break;
            case "NewTopic":
                if (!qrFocus) {
                    let image = document.querySelector('img[src$="post.gif"]') as HTMLImageElement;
                    let anchor = image.parentNode as HTMLAnchorElement;
                    window.location.href = anchor.href;
                    shouldPreventDefault = true; // Same as above.
                }
                break;
            case "GetIpInformation":
                if (!qrFocus) {
                    let postInfo = this._ctx.RUSKPage.selectedItem as PostInfo;
                    if (postInfo == null) return;
                    if (!postInfo.ipInfoUrl || postInfo.ipInfoUrl.length == 0) return;
                    window.location.href = postInfo.ipInfoUrl;
                    shouldPreventDefault = true; // And this as well
                }
                break;
            default:
                Log.Error('Unhandled hotkey ' + cmd + ' received in KeyboardNavigation module');
                break;
        }

        return shouldPreventDefault;
    }

    private replyToSelected() {
        let selectedItem = this._ctx.RUSKPage.selectedItem as PostInfo;
        if (selectedItem) {
            // Lagre hva vi skal svare på! Dette plukkes etterhvert opp av plugin for posting-side.
            var replyObject = {
                date: selectedItem.postedDate,
                text: selectedItem.postTextBody,
                author: selectedItem.posterNickname
            };
            localStorage.setItem('ruskReplyObject', JSON.stringify(replyObject));
        }
        let image = document.querySelector('img[src$="reply.gif"]') as HTMLImageElement;
        let anchor = image.parentNode as HTMLAnchorElement;
        window.location.href = anchor.href;
    }

    private quickReplyIfEnabled() {
        let quickReplyButton = this._ctx.RUSKPage.selectedItem.rowElement.querySelector('a[name="quickreply"]') as HTMLAnchorElement;
        if (quickReplyButton == null) {
            this.replyToSelected();
        } else {
            quickReplyButton.click();
        }
    }

    private quickReplyHasFocus(): boolean {
        return this.quickReplyElement === document.activeElement;
    }
}
