# clark-individual-interviews

クラーク高校演劇部・**個人面談**の分析を行うための **private** リポジトリ。

> [!IMPORTANT]
> 本リポジトリは、既存の `clark-group_session` とは **完全に別のprivateリポジトリ** です。
> 個人面談の生データを既存リポジトリへ **移動・複製・参照してはいけません**。
> 将来の比較は、**承認済みの非再識別・集計済み結果だけ** で行います。

## 現在の状態

**初期設定のみ完了。** 文字起こし・話者推定・テーマ分析・公開用出力・動画ダウンロードは
いずれも **未実施であり、実行してはいけません**。

個人面談データの初期取扱区分は **すべて `pending`** です。
`pending` のデータは **分析・引用・外部共有・公開をしません**。

## 基本方針

- GitHub Pages、公開ダッシュボード、公開用データは **作成しません**。
- 動画の所有・利用権限、文字起こし・分析への同意、学校・保護者を含む必要な手続きは、
  **人間の責任者が確認** します。エージェントや自動処理はこれを代替できません。
- 氏名等と匿名IDの対応表は **Gitに置かず、別保管** します。
- 分析単位は **`interview_id` / `question_id` / `response_id` の三層** とします。
- 個人面談では **話者分離を前提にしません**。面談者と生徒の区別が必要になった場合も、
  まず **質問ログ（question register）** で処理します。
- 生動画・音声・文字起こし・アンケート回答・個別回答・時刻・話者ID・個人別集計は、
  **公開／共有用成果物に含めません**。
- 「個人面談＝本音、グループ＝建前」とは **解釈しません**。**面談形式の違い** として比較します。

## ディレクトリ構成

```text
.
├── README.md
├── AGENTS.md
├── .gitignore
├── docs/
│   ├── protocol/                 # 分析範囲・質問台帳の定義
│   └── governance/               # データ取扱方針・公開ゲート
├── private/                      # Git追跡しない（要配慮データのローカル保管）
│   ├── intake/                   # 事前アンケート等の受け入れ原本
│   ├── consent/                  # 同意関連の記録
│   ├── registers/                # 実データ入りの各台帳
│   ├── transcripts/              # 文字起こし（将来）
│   ├── anonymized/               # 非再識別化後データ（将来）
│   ├── coding/                   # コーディング作業（将来）
│   └── review/                   # 人手レビュー記録
├── sources/                      # Git追跡しない（動画・音声等の原本）
├── derived/                      # Git追跡しない（中間生成物）
├── exports/                      # Git追跡しない（出力候補。公開物ではない）
├── scripts/                      # 処理スクリプト（実データは置かない）
└── tests/                        # テスト（実データは置かない）
```

`private/`・`sources/`・`derived/`・`exports/` は `.gitignore` により **Git追跡対象外** です。
これらのディレクトリには `.gitkeep` を置かず、ローカルにのみ存在させます。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/governance/DATA_HANDLING_POLICY.md](docs/governance/DATA_HANDLING_POLICY.md) | データ取扱方針（区分・保管・禁止事項） |
| [docs/governance/RELEASE_GATE.md](docs/governance/RELEASE_GATE.md) | 共有・公開の可否判定ゲート |
| [docs/protocol/ANALYSIS_SCOPE.md](docs/protocol/ANALYSIS_SCOPE.md) | 分析範囲と分析単位の定義 |
| [docs/protocol/QUESTION_REGISTER_TEMPLATE.md](docs/protocol/QUESTION_REGISTER_TEMPLATE.md) | 質問台帳の作り方（質問文のみ、回答と分離） |
| [AGENTS.md](AGENTS.md) | エージェント／自動処理への制約 |

## 台帳テンプレート（実データを含まない列定義のみ）

- [docs/protocol/intake_register_template.csv](docs/protocol/intake_register_template.csv)
- [docs/protocol/question_register_template.csv](docs/protocol/question_register_template.csv)
- [docs/protocol/interview_register_template.csv](docs/protocol/interview_register_template.csv)
- [docs/governance/consent_scope_register_template.csv](docs/governance/consent_scope_register_template.csv)
- [docs/governance/release_register_template.csv](docs/governance/release_register_template.csv)

実データを記入した台帳は、テンプレートをコピーして **`private/registers/` 配下にのみ** 保存します。
テンプレート本体に実データを書き込んではいけません。

## 事前アンケートの扱い

事前アンケートには、氏名、呼ばれたい名前、悩み、検索履歴・メモ・SNSに関わる内容、
感情が強く動いた出来事、面談で話したいことが含まれます。
**要配慮性の高い生データ** として扱います。

- CSVの内容を **表示・要約・分析しない**
- Gitに **追加・commitしない**
- `private/intake/` に **ローカル保管** する
- **質問文だけ** を、実回答と分離して手順書（質問台帳）に記録してよい
- アンケート回答を将来の分析対象に含めるかは、**面談動画の同意とは別に確認するまで保留**

詳細は [docs/protocol/QUESTION_REGISTER_TEMPLATE.md](docs/protocol/QUESTION_REGISTER_TEMPLATE.md) を参照。
